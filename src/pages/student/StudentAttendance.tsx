import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarCheck, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface AttendanceRecord {
  id: string;
  status: string;
  check_in_time: string | null;
  session: {
    session_date: string;
    start_time: string;
    end_time: string;
    course: {
      name: string;
      code: string;
    } | null;
  } | null;
}

interface SubjectAttendance {
  courseId: string;
  courseName: string;
  courseCode: string;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

export default function StudentAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [subjectAttendance, setSubjectAttendance] = useState<SubjectAttendance[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [overallStats, setOverallStats] = useState({
    totalClasses: 0,
    present: 0,
    absent: 0,
    late: 0,
    percentage: 0,
  });

  useEffect(() => {
    if (user) {
      fetchAttendance();
    }
  }, [user]);

  const fetchAttendance = async () => {
    try {
      // Get student record
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!studentData) {
        setLoading(false);
        return;
      }

      // Fetch attendance records
      const { data: records, error } = await supabase
        .from("attendance_records")
        .select(`
          id,
          status,
          check_in_time,
          session_id
        `)
        .eq("student_id", studentData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch session details for each record
      const recordsWithSessions: AttendanceRecord[] = [];
      const courseStats: Record<string, SubjectAttendance> = {};

      for (const record of records || []) {
        const { data: session } = await supabase
          .from("attendance_sessions")
          .select(`
            session_date,
            start_time,
            end_time,
            course_id
          `)
          .eq("id", record.session_id)
          .maybeSingle();

        let course = null;
        if (session?.course_id) {
          const { data: courseData } = await supabase
            .from("courses")
            .select("name, code")
            .eq("id", session.course_id)
            .maybeSingle();
          course = courseData;

          // Aggregate by course
          if (!courseStats[session.course_id]) {
            courseStats[session.course_id] = {
              courseId: session.course_id,
              courseName: course?.name || "Unknown",
              courseCode: course?.code || "",
              totalClasses: 0,
              present: 0,
              absent: 0,
              late: 0,
              percentage: 0,
            };
          }
          courseStats[session.course_id].totalClasses++;
          if (record.status === "present") courseStats[session.course_id].present++;
          if (record.status === "absent") courseStats[session.course_id].absent++;
          if (record.status === "late") courseStats[session.course_id].late++;
        }

        recordsWithSessions.push({
          ...record,
          session: session ? { ...session, course } : null,
        });
      }

      // Calculate percentages
      Object.values(courseStats).forEach((stat) => {
        stat.percentage = stat.totalClasses > 0 
          ? Math.round(((stat.present + stat.late) / stat.totalClasses) * 100) 
          : 0;
      });

      setAttendanceRecords(recordsWithSessions);
      setSubjectAttendance(Object.values(courseStats));

      // Calculate overall stats
      const overall = Object.values(courseStats).reduce(
        (acc, stat) => ({
          totalClasses: acc.totalClasses + stat.totalClasses,
          present: acc.present + stat.present,
          absent: acc.absent + stat.absent,
          late: acc.late + stat.late,
          percentage: 0,
        }),
        { totalClasses: 0, present: 0, absent: 0, late: 0, percentage: 0 }
      );
      overall.percentage = overall.totalClasses > 0
        ? Math.round(((overall.present + overall.late) / overall.totalClasses) * 100)
        : 0;
      setOverallStats(overall);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Present</Badge>;
      case "absent":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Absent</Badge>;
      case "late":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" />Late</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredRecords = selectedSubject === "all"
    ? attendanceRecords
    : attendanceRecords.filter((r) => r.session?.course?.code === selectedSubject);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Attendance</h1>
        <p className="text-muted-foreground">View your attendance records and statistics</p>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{overallStats.percentage}%</div>
            <Progress value={overallStats.percentage} className="mt-2" />
            {overallStats.percentage < 75 && (
              <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Below 75% minimum
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{overallStats.totalClasses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{overallStats.present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{overallStats.absent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Attendance</CardTitle>
          <CardDescription>Your attendance breakdown by subject</CardDescription>
        </CardHeader>
        <CardContent>
          {subjectAttendance.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No attendance records found</p>
          ) : (
            <div className="space-y-4">
              {subjectAttendance.map((subject) => (
                <div key={subject.courseId} className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="h-5 w-5 text-primary" />
                      <span className="font-medium text-foreground">{subject.courseName}</span>
                      <Badge variant="outline">{subject.courseCode}</Badge>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Total: {subject.totalClasses}</span>
                      <span className="text-green-500">Present: {subject.present}</span>
                      <span className="text-yellow-500">Late: {subject.late}</span>
                      <span className="text-destructive">Absent: {subject.absent}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24">
                      <Progress 
                        value={subject.percentage} 
                        className={subject.percentage < 75 ? "[&>div]:bg-destructive" : ""}
                      />
                    </div>
                    <span className={`font-bold ${subject.percentage < 75 ? "text-destructive" : "text-foreground"}`}>
                      {subject.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>Detailed attendance records</CardDescription>
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjectAttendance.map((subject) => (
                  <SelectItem key={subject.courseCode} value={subject.courseCode}>
                    {subject.courseCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No records found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.session?.session_date 
                        ? new Date(record.session.session_date).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {record.session?.course?.code || "-"}
                    </TableCell>
                    <TableCell>
                      {record.session?.start_time && record.session?.end_time
                        ? `${record.session.start_time.slice(0, 5)} - ${record.session.end_time.slice(0, 5)}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {record.check_in_time
                        ? new Date(record.check_in_time).toLocaleTimeString()
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
