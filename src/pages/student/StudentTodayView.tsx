import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Clock, MapPin, BookOpen, User, Calendar, QrCode, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { format, differenceInMinutes, parse, isWithinInterval, addMinutes } from "date-fns";

interface TodayClass {
  id: string;
  periodNumber: number;
  periodName: string;
  startTime: string;
  endTime: string;
  courseName: string;
  courseCode: string;
  facultyName: string;
  roomName: string | null;
  roomNumber: string | null;
  status: "completed" | "current" | "upcoming";
  attendanceMarked: boolean;
}

export default function StudentTodayView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Get student's section
  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ["student-enrollment", user?.id],
    queryFn: async () => {
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();
      
      if (!student) return null;

      const { data: enrollment } = await supabase
        .from("student_enrollments")
        .select(`
          section_id,
          sections:section_id(
            id, 
            section_name, 
            display_name,
            batch_id,
            batches:batch_id(name, current_semester)
          )
        `)
        .eq("student_id", student.id)
        .eq("status", "active")
        .maybeSingle();

      return { studentId: student.id, enrollment };
    },
    enabled: !!user,
  });

  // Get today's timetable
  const dayOfWeek = currentTime.getDay();
  
  const { data: todaySlots, isLoading: slotsLoading } = useQuery({
    queryKey: ["student-today-slots", studentData?.enrollment?.section_id, dayOfWeek],
    queryFn: async () => {
      if (!studentData?.enrollment?.section_id) return [];

      const { data, error } = await supabase
        .from("timetable_slots")
        .select(`
          id,
          start_time,
          end_time,
          periods:period_id(period_number, name, start_time, end_time),
          course_assignments:course_assignment_id(
            courses:course_id(name, code),
            faculty:faculty_id(first_name, last_name)
          ),
          geo_fence_zones:zone_id(name, room_number)
        `)
        .eq("section_id", studentData.enrollment.section_id)
        .eq("day_of_week", dayOfWeek)
        .order("start_time");

      if (error) throw error;
      return data;
    },
    enabled: !!studentData?.enrollment?.section_id,
  });

  // Check today's attendance records
  const { data: attendanceRecords } = useQuery({
    queryKey: ["student-today-attendance", studentData?.studentId],
    queryFn: async () => {
      if (!studentData?.studentId) return [];

      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data } = await supabase
        .from("attendance_records")
        .select(`
          id,
          status,
          session_id,
          attendance_sessions:session_id(course_id)
        `)
        .eq("student_id", studentData.studentId);

      return data || [];
    },
    enabled: !!studentData?.studentId,
  });

  // Check for active attendance sessions
  const { data: activeSessions } = useQuery({
    queryKey: ["active-sessions-today"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data } = await supabase
        .from("attendance_sessions")
        .select("id, course_id")
        .eq("session_date", today)
        .eq("status", "active");
      return data || [];
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Enable realtime for attendance sessions
  useEffect(() => {
    const channel = supabase
      .channel("attendance-sessions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_sessions",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["active-sessions-today"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Process today's classes
  const todayClasses = useMemo((): TodayClass[] => {
    if (!todaySlots) return [];

    const now = currentTime;
    const currentTimeStr = format(now, "HH:mm:ss");

    return todaySlots.map((slot: any): TodayClass => {
      const startTime = slot.periods?.start_time || slot.start_time;
      const endTime = slot.periods?.end_time || slot.end_time;
      
      // Determine status
      let status: "completed" | "current" | "upcoming" = "upcoming";
      
      if (currentTimeStr >= endTime) {
        status = "completed";
      } else if (currentTimeStr >= startTime && currentTimeStr < endTime) {
        status = "current";
      }

      // Check if attendance was marked
      const courseId = slot.course_assignments?.courses?.id;
      const hasAttendance = attendanceRecords?.some(
        (rec: any) => rec.attendance_sessions?.course_id === courseId
      );

      return {
        id: slot.id,
        periodNumber: slot.periods?.period_number || 0,
        periodName: slot.periods?.name || "Class",
        startTime,
        endTime,
        courseName: slot.course_assignments?.courses?.name || "Unknown",
        courseCode: slot.course_assignments?.courses?.code || "",
        facultyName: slot.course_assignments?.faculty 
          ? `${slot.course_assignments.faculty.first_name} ${slot.course_assignments.faculty.last_name}`
          : "TBA",
        roomName: slot.geo_fence_zones?.name || null,
        roomNumber: slot.geo_fence_zones?.room_number || null,
        status,
        attendanceMarked: hasAttendance || false,
      };
    });
  }, [todaySlots, currentTime, attendanceRecords]);

  const currentClass = todayClasses.find((c) => c.status === "current");
  const nextClass = todayClasses.find((c) => c.status === "upcoming");
  const completedClasses = todayClasses.filter((c) => c.status === "completed");

  // Calculate time until next class
  const timeUntilNext = useMemo(() => {
    if (!nextClass) return null;
    
    const now = currentTime;
    const nextStart = parse(nextClass.startTime, "HH:mm:ss", now);
    const mins = differenceInMinutes(nextStart, now);
    
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  }, [nextClass, currentTime]);

  // Check if current class has active attendance
  const currentClassHasActiveAttendance = useMemo(() => {
    if (!currentClass || !activeSessions) return false;
    // This would require matching course_id, simplified for now
    return activeSessions.length > 0;
  }, [currentClass, activeSessions]);

  const isLoading = studentLoading || slotsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!studentData?.enrollment) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Today's Schedule</h1>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You are not enrolled in any section. Please contact the admin.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Today's Schedule</h1>
          <p className="text-muted-foreground mt-1">
            {format(currentTime, "EEEE, MMMM d, yyyy")} • {format(currentTime, "h:mm a")}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {studentData.enrollment.sections?.display_name || 
           `${studentData.enrollment.sections?.batches?.name} - Section ${studentData.enrollment.sections?.section_name}`}
        </Badge>
      </div>

      {/* Current Class - Prominent Display */}
      {currentClass ? (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <CardTitle className="text-lg">Currently In Progress</CardTitle>
              </div>
              {currentClassHasActiveAttendance && !currentClass.attendanceMarked && (
                <Button asChild>
                  <Link to="/student/mark-attendance">
                    <QrCode className="mr-2 h-4 w-4" />
                    Mark Attendance
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="text-lg px-3 py-1">{currentClass.courseCode}</Badge>
                  <span className="text-xl font-semibold">{currentClass.courseName}</span>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{currentClass.facultyName}</span>
                  </div>
                  {currentClass.roomName && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{currentClass.roomNumber || currentClass.roomName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{currentClass.startTime.slice(0,5)} - {currentClass.endTime.slice(0,5)}</span>
                  </div>
                </div>
              </div>
              {currentClass.attendanceMarked && (
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                  Attendance Marked
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-muted/50">
          <CardContent className="py-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Class In Progress</h3>
            <p className="text-muted-foreground">
              {nextClass ? "Your next class starts soon" : "No more classes today"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Next Class */}
      {nextClass && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ChevronRight className="h-5 w-5" />
                Next Class
              </CardTitle>
              <Badge variant="secondary">Starts in {timeUntilNext}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{nextClass.courseCode}</Badge>
                  <span className="font-medium">{nextClass.courseName}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{nextClass.facultyName}</span>
                  {nextClass.roomName && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {nextClass.roomNumber || nextClass.roomName}
                    </span>
                  )}
                  <span>{nextClass.startTime.slice(0,5)} - {nextClass.endTime.slice(0,5)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Day Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Full Day Schedule
          </CardTitle>
          <CardDescription>
            {todayClasses.length} classes scheduled • {completedClasses.length} completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayClasses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No classes scheduled for today
            </div>
          ) : (
            <div className="space-y-3">
              {todayClasses.map((cls) => (
                <div 
                  key={cls.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    cls.status === "current" 
                      ? "bg-primary/5 border-primary/20" 
                      : cls.status === "completed" 
                        ? "bg-muted/50 opacity-60" 
                        : "bg-background"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-sm font-medium">{cls.periodName}</div>
                      <div className="text-xs text-muted-foreground">
                        {cls.startTime.slice(0,5)}
                      </div>
                    </div>
                    <div className="border-l pl-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{cls.courseCode}</Badge>
                        <span className="font-medium">{cls.courseName}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {cls.facultyName}
                        {cls.roomName && ` • ${cls.roomNumber || cls.roomName}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cls.status === "completed" && cls.attendanceMarked && (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                        Present
                      </Badge>
                    )}
                    {cls.status === "current" && (
                      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                        In Progress
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button variant="outline" asChild className="flex-1">
          <Link to="/student/timetable">
            <Calendar className="mr-2 h-4 w-4" />
            View Full Timetable
          </Link>
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link to="/student/attendance">
            <BookOpen className="mr-2 h-4 w-4" />
            Attendance History
          </Link>
        </Button>
      </div>
    </div>
  );
}
