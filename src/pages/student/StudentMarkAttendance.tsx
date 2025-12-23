import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QrCode, Camera, CheckCircle, XCircle, Clock, MapPin, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";

interface ActiveSession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  late_threshold_minutes: number | null;
  course: {
    name: string;
    code: string;
  } | null;
  zone: {
    latitude: number;
    longitude: number;
    radius_meters: number;
    name: string;
  } | null;
}

export default function StudentMarkAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<"idle" | "success" | "error" | "already_marked">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (user) {
      fetchStudentAndSessions();
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [user]);

  const fetchStudentAndSessions = async () => {
    try {
      // Get student record
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (studentData) {
        setStudentId(studentData.id);
      }

      // Fetch active sessions
      const today = new Date().toISOString().split("T")[0];
      const { data: sessions, error } = await supabase
        .from("attendance_sessions")
        .select(`
          id,
          session_date,
          start_time,
          end_time,
          late_threshold_minutes,
          course_id,
          zone_id
        `)
        .eq("session_date", today)
        .eq("status", "active");

      if (error) throw error;

      const enrichedSessions: ActiveSession[] = [];

      for (const session of sessions || []) {
        let course = null;
        let zone = null;

        if (session.course_id) {
          const { data: courseData } = await supabase
            .from("courses")
            .select("name, code")
            .eq("id", session.course_id)
            .maybeSingle();
          course = courseData;
        }

        if (session.zone_id) {
          const { data: zoneData } = await supabase
            .from("geo_fence_zones")
            .select("latitude, longitude, radius_meters, name")
            .eq("id", session.zone_id)
            .maybeSingle();
          zone = zoneData;
        }

        enrichedSessions.push({ ...session, course, zone });
      }

      setActiveSessions(enrichedSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load active sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const startScanning = async (session: ActiveSession) => {
    setSelectedSession(session);
    setAttendanceStatus("idle");
    setErrorMessage("");

    try {
      const location = await getUserLocation();
      setUserLocation(location);

      // Check if within geo-fence
      if (session.zone) {
        const distance = calculateDistance(
          location.lat,
          location.lng,
          session.zone.latitude,
          session.zone.longitude
        );

        if (distance > session.zone.radius_meters) {
          setAttendanceStatus("error");
          setErrorMessage(`You are ${Math.round(distance)}m away from the classroom. Please move closer (within ${session.zone.radius_meters}m).`);
          return;
        }
      }

      setScanning(true);

      // Initialize QR scanner
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await handleQRCode(decodedText, session, location);
          scanner.stop().catch(() => {});
          setScanning(false);
        },
        () => {} // Ignore errors during scanning
      );
    } catch (error: any) {
      console.error("Error starting scan:", error);
      setAttendanceStatus("error");
      setErrorMessage(error.message || "Failed to access camera or location");
      setScanning(false);
    }
  };

  const handleQRCode = async (
    qrData: string,
    session: ActiveSession,
    location: { lat: number; lng: number }
  ) => {
    try {
      // Parse QR code data
      const qrPayload = JSON.parse(qrData);

      // Validate QR code
      if (qrPayload.sessionId !== session.id) {
        setAttendanceStatus("error");
        setErrorMessage("Invalid QR code. This QR code is for a different session.");
        return;
      }

      // Check if QR code is expired
      const qrTimestamp = new Date(qrPayload.timestamp);
      const now = new Date();
      const diffSeconds = (now.getTime() - qrTimestamp.getTime()) / 1000;

      if (diffSeconds > 60) {
        setAttendanceStatus("error");
        setErrorMessage("QR code has expired. Please ask the faculty to generate a new one.");
        return;
      }

      if (!studentId) {
        setAttendanceStatus("error");
        setErrorMessage("Student profile not found. Please contact admin.");
        return;
      }

      // Check if already marked
      const { data: existing } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("session_id", session.id)
        .eq("student_id", studentId)
        .maybeSingle();

      if (existing) {
        setAttendanceStatus("already_marked");
        return;
      }

      // Determine if late
      const sessionStart = new Date(`${session.session_date}T${session.start_time}`);
      const lateThreshold = session.late_threshold_minutes || 15;
      const isLate = (now.getTime() - sessionStart.getTime()) / 60000 > lateThreshold;

      // Mark attendance
      const { error } = await supabase
        .from("attendance_records")
        .insert({
          session_id: session.id,
          student_id: studentId,
          status: isLate ? "late" : "present",
          check_in_time: now.toISOString(),
          check_in_latitude: location.lat,
          check_in_longitude: location.lng,
          check_in_method: "qr_scan",
        });

      if (error) throw error;

      setAttendanceStatus("success");
      toast({
        title: "Attendance Marked!",
        description: isLate ? "You have been marked as late." : "You have been marked as present.",
      });
    } catch (error: any) {
      console.error("Error marking attendance:", error);
      setAttendanceStatus("error");
      setErrorMessage(error.message || "Failed to mark attendance. Please try again.");
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
    }
    setScanning(false);
    setSelectedSession(null);
    setAttendanceStatus("idle");
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
        <h1 className="text-2xl font-bold text-foreground">Mark Attendance</h1>
        <p className="text-muted-foreground">Scan QR code to mark your attendance</p>
      </div>

      {/* Active Sessions */}
      {!selectedSession && (
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Classes currently accepting attendance</CardDescription>
          </CardHeader>
          <CardContent>
            {activeSessions.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active attendance sessions right now</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check back when your class starts
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {session.course?.name || "Unknown Course"}
                        </span>
                        <Badge variant="outline">{session.course?.code}</Badge>
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                          Active
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                        </span>
                        {session.zone && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {session.zone.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button onClick={() => startScanning(session)}>
                      <QrCode className="h-4 w-4 mr-2" />
                      Scan QR
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* QR Scanner */}
      {selectedSession && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Scanning for {selectedSession.course?.name}</CardTitle>
                <CardDescription>Point your camera at the QR code</CardDescription>
              </div>
              <Button variant="outline" onClick={stopScanning}>
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {scanning && (
              <div className="relative">
                <div id="qr-reader" className="w-full max-w-md mx-auto rounded-lg overflow-hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-2 border-primary rounded-lg animate-pulse" />
                </div>
              </div>
            )}

            {attendanceStatus === "success" && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <AlertTitle className="text-green-500">Attendance Marked Successfully!</AlertTitle>
                <AlertDescription>
                  Your attendance has been recorded for {selectedSession.course?.name}.
                </AlertDescription>
              </Alert>
            )}

            {attendanceStatus === "already_marked" && (
              <Alert className="bg-blue-500/10 border-blue-500/20">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                <AlertTitle className="text-blue-500">Already Marked</AlertTitle>
                <AlertDescription>
                  Your attendance for this session has already been recorded.
                </AlertDescription>
              </Alert>
            )}

            {attendanceStatus === "error" && (
              <Alert variant="destructive">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Attendance Failed</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {attendanceStatus !== "idle" && (
              <div className="flex justify-center">
                <Button onClick={stopScanning}>Done</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Mark Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Wait for your faculty to start the attendance session</li>
            <li>Make sure you are within the classroom area</li>
            <li>Click "Scan QR" on the active session</li>
            <li>Allow camera and location access when prompted</li>
            <li>Point your camera at the QR code displayed by faculty</li>
            <li>Wait for confirmation of your attendance</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
