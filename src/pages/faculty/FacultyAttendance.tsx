import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QrCode, Play, Square, Users, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Course {
  id: string;
  name: string;
  code: string;
}

interface AttendanceSession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string | null;
  course_id: string | null;
  zone_id: string | null;
}

interface StudentAttendance {
  id: string | null;
  student_id: string;
  status: string;
  check_in_time: string | null;
  student: {
    first_name: string;
    last_name: string;
    roll_number: string;
  } | null;
}

interface EnrolledStudent {
  id: string;
  first_name: string;
  last_name: string;
  roll_number: string;
}

export default function FacultyAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [sessionStudents, setSessionStudents] = useState<StudentAttendance[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [qrData, setQrData] = useState<string>("");
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [facultyId, setFacultyId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchFacultyData();
    }
  }, [user]);

  useEffect(() => {
    if (activeSession) {
      fetchSessionStudents(activeSession.id);
      fetchEnrolledStudents();
      // Refresh QR code every 30 seconds
      const interval = setInterval(() => {
        generateQRCode(activeSession.id);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [activeSession]);

  const fetchFacultyData = async () => {
    try {
      // Get faculty record
      const { data: facultyData } = await supabase
        .from("faculty")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (facultyData) {
        setFacultyId(facultyData.id);

        // Fetch courses assigned to this faculty
        const { data: assignments } = await supabase
          .from("course_assignments")
          .select("course_id")
          .eq("faculty_id", facultyData.id);

        if (assignments && assignments.length > 0) {
          const courseIds = assignments.map((a) => a.course_id).filter(Boolean);
          const { data: coursesData } = await supabase
            .from("courses")
            .select("id, name, code")
            .in("id", courseIds);
          setCourses(coursesData || []);
        }

        // Check for active session
        const today = new Date().toISOString().split("T")[0];
        const { data: sessions } = await supabase
          .from("attendance_sessions")
          .select("*")
          .eq("faculty_id", facultyData.id)
          .eq("session_date", today)
          .eq("status", "active")
          .maybeSingle();

        if (sessions) {
          setActiveSession(sessions);
          setSelectedCourse(sessions.course_id || "");
          generateQRCode(sessions.id);
        }
      }
    } catch (error) {
      console.error("Error fetching faculty data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionStudents = async (sessionId: string) => {
    try {
      const { data: records } = await supabase
        .from("attendance_records")
        .select("id, student_id, status, check_in_time")
        .eq("session_id", sessionId);

      const enrichedRecords: StudentAttendance[] = [];

      for (const record of records || []) {
        const { data: student } = await supabase
          .from("students")
          .select("first_name, last_name, roll_number")
          .eq("id", record.student_id)
          .maybeSingle();

        enrichedRecords.push({ ...record, student });
      }

      setSessionStudents(enrichedRecords);
    } catch (error) {
      console.error("Error fetching session students:", error);
    }
  };

  const fetchEnrolledStudents = async () => {
    if (!activeSession?.course_id) return;

    try {
      // Get the batch for this course assignment
      const { data: assignment } = await supabase
        .from("course_assignments")
        .select("batch_id")
        .eq("course_id", activeSession.course_id)
        .maybeSingle();

      if (!assignment?.batch_id) return;

      // Get sections for this batch
      const { data: sections } = await supabase
        .from("sections")
        .select("id")
        .eq("batch_id", assignment.batch_id);

      if (!sections || sections.length === 0) return;

      const sectionIds = sections.map(s => s.id);

      // Get enrolled students
      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select("student_id")
        .in("section_id", sectionIds)
        .eq("status", "active");

      if (!enrollments || enrollments.length === 0) return;

      const studentIds = enrollments.map(e => e.student_id);

      // Get student details
      const { data: students } = await supabase
        .from("students")
        .select("id, first_name, last_name, roll_number")
        .in("id", studentIds)
        .order("roll_number");

      setEnrolledStudents(students || []);
    } catch (error) {
      console.error("Error fetching enrolled students:", error);
    }
  };

  const generateQRCode = (sessionId: string) => {
    const payload = JSON.stringify({
      sessionId,
      timestamp: new Date().toISOString(),
      expiresIn: 60, // seconds
    });
    setQrData(payload);
  };

  const startSession = async () => {
    if (!selectedCourse || !facultyId) return;

    try {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const currentTime = now.toTimeString().split(" ")[0];
      const endTime = new Date(now.getTime() + 60 * 60 * 1000).toTimeString().split(" ")[0]; // 1 hour later

      const { data: session, error } = await supabase
        .from("attendance_sessions")
        .insert({
          course_id: selectedCourse,
          faculty_id: facultyId,
          session_date: today,
          start_time: currentTime,
          end_time: endTime,
          status: "active",
          late_threshold_minutes: 15,
        })
        .select()
        .single();

      if (error) throw error;

      setActiveSession(session);
      generateQRCode(session.id);
      setShowQRDialog(true);

      toast({
        title: "Session Started",
        description: "Attendance session is now active. Show the QR code to students.",
      });
    } catch (error: any) {
      console.error("Error starting session:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start session",
        variant: "destructive",
      });
    }
  };

  const stopSession = async () => {
    if (!activeSession) return;

    try {
      const { error } = await supabase
        .from("attendance_sessions")
        .update({ status: "completed" })
        .eq("id", activeSession.id);

      if (error) throw error;

      setActiveSession(null);
      setShowQRDialog(false);
      setQrData("");

      toast({
        title: "Session Ended",
        description: "Attendance session has been closed.",
      });
    } catch (error: any) {
      console.error("Error stopping session:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to stop session",
        variant: "destructive",
      });
    }
  };

  const manualMarkAttendance = async (studentId: string, status: string) => {
    if (!activeSession) return;

    try {
      // Check if already marked
      const { data: existing } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("session_id", activeSession.id)
        .eq("student_id", studentId)
        .maybeSingle();

      if (existing) {
        // Update existing
        await supabase
          .from("attendance_records")
          .update({ status, marked_by: facultyId })
          .eq("id", existing.id);
      } else {
        // Insert new
        await supabase
          .from("attendance_records")
          .insert({
            session_id: activeSession.id,
            student_id: studentId,
            status,
            check_in_method: "manual",
            marked_by: facultyId,
            check_in_time: new Date().toISOString(),
          });
      }

      fetchSessionStudents(activeSession.id);
      toast({
        title: "Attendance Updated",
        description: `Student marked as ${status}`,
      });
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast({
        title: "Error",
        description: "Failed to update attendance",
        variant: "destructive",
      });
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
        <h1 className="text-2xl font-bold text-foreground">Attendance Management</h1>
        <p className="text-muted-foreground">Start sessions and track student attendance</p>
      </div>

      {/* Session Control */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Session</CardTitle>
          <CardDescription>
            {activeSession ? "Session in progress" : "Start a new attendance session"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select
              value={selectedCourse}
              onValueChange={setSelectedCourse}
              disabled={!!activeSession}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeSession ? (
              <div className="flex gap-2">
                <Button onClick={() => setShowQRDialog(true)}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Show QR Code
                </Button>
                <Button variant="destructive" onClick={stopSession}>
                  <Square className="h-4 w-4 mr-2" />
                  End Session
                </Button>
              </div>
            ) : (
              <Button onClick={startSession} disabled={!selectedCourse}>
                <Play className="h-4 w-4 mr-2" />
                Start Session
              </Button>
            )}
          </div>

          {activeSession && (
            <div className="flex items-center gap-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium text-green-500">Session Active</span>
              </div>
              <span className="text-muted-foreground">
                Started at {activeSession.start_time.slice(0, 5)}
              </span>
              <span className="text-muted-foreground">
                {sessionStudents.filter((s) => s.status === "present" || s.status === "late").length} students checked in
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student List */}
      {activeSession && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Student Attendance
                </CardTitle>
                <CardDescription>
                  {sessionStudents.length} students marked
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => fetchSessionStudents(activeSession.id)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolledStudents.map((student) => {
                  const attendanceRecord = sessionStudents.find(
                    (r) => r.student_id === student.id
                  );
                  const status = attendanceRecord?.status || "not_marked";

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.roll_number}
                      </TableCell>
                      <TableCell>
                        {student.first_name} {student.last_name}
                      </TableCell>
                      <TableCell>
                        {attendanceRecord?.check_in_time
                          ? format(new Date(attendanceRecord.check_in_time), "h:mm a")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {status === "not_marked" ? (
                          <Badge variant="secondary">Not Marked</Badge>
                        ) : (
                          getStatusBadge(status)
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={status === "present" ? "default" : "outline"}
                            onClick={() => manualMarkAttendance(student.id, "present")}
                          >
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant={status === "absent" ? "destructive" : "outline"}
                            onClick={() => manualMarkAttendance(student.id, "absent")}
                          >
                            Absent
                          </Button>
                          <Button
                            size="sm"
                            variant={status === "late" ? "secondary" : "outline"}
                            onClick={() => manualMarkAttendance(student.id, "late")}
                          >
                            Late
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {enrolledStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No enrolled students found for this course.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Attendance QR Code</DialogTitle>
            <DialogDescription>
              Students can scan this code to mark their attendance
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="p-4 bg-white rounded-lg">
              <QRCodeSVG value={qrData} size={256} />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              QR code refreshes every 30 seconds for security
            </p>
            <Button variant="outline" onClick={() => generateQRCode(activeSession?.id || "")}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Now
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowQRDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
