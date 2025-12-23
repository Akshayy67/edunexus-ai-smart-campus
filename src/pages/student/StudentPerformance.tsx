import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, Award, Calendar, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface PerformanceData {
  attendance: {
    overall: number;
    trend: "up" | "down" | "stable";
    bySubject: { name: string; percentage: number }[];
  };
  academics: {
    overall: number;
    trend: "up" | "down" | "stable";
    bySubject: { name: string; percentage: number }[];
  };
  submissions: {
    total: number;
    onTime: number;
    late: number;
  };
  monthlyTrend: { month: string; attendance: number; academics: number }[];
}

export default function StudentPerformance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<PerformanceData>({
    attendance: { overall: 0, trend: "stable", bySubject: [] },
    academics: { overall: 0, trend: "stable", bySubject: [] },
    submissions: { total: 0, onTime: 0, late: 0 },
    monthlyTrend: [],
  });

  useEffect(() => {
    if (user) {
      fetchPerformanceData();
    }
  }, [user]);

  const fetchPerformanceData = async () => {
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

      // Fetch attendance data
      const { data: attendanceRecords } = await supabase
        .from("attendance_records")
        .select("status, session_id")
        .eq("student_id", studentData.id);

      // Calculate attendance stats
      const totalAttendance = attendanceRecords?.length || 0;
      const presentCount = attendanceRecords?.filter((r) => r.status === "present" || r.status === "late").length || 0;
      const attendancePercentage = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

      // Fetch submissions data
      const { data: submissions } = await supabase
        .from("assessment_submissions")
        .select("is_late, marks_obtained, status, assessment_id")
        .eq("student_id", studentData.id);

      const totalSubmissions = submissions?.length || 0;
      const onTimeSubmissions = submissions?.filter((s) => !s.is_late).length || 0;
      const lateSubmissions = submissions?.filter((s) => s.is_late).length || 0;

      // Calculate academic stats from graded submissions
      const gradedSubmissions = submissions?.filter((s) => s.status === "graded" && s.marks_obtained !== null) || [];
      let academicPercentage = 0;

      if (gradedSubmissions.length > 0) {
        let totalObtained = 0;
        let totalMarks = 0;

        for (const sub of gradedSubmissions) {
          const { data: assessment } = await supabase
            .from("assessments")
            .select("total_marks")
            .eq("id", sub.assessment_id)
            .maybeSingle();

          if (assessment) {
            totalObtained += sub.marks_obtained!;
            totalMarks += assessment.total_marks;
          }
        }

        academicPercentage = totalMarks > 0 ? Math.round((totalObtained / totalMarks) * 100) : 0;
      }

      // Mock monthly trend data (in production, calculate from actual records)
      const monthlyTrend = [
        { month: "Aug", attendance: 92, academics: 78 },
        { month: "Sep", attendance: 88, academics: 82 },
        { month: "Oct", attendance: 85, academics: 75 },
        { month: "Nov", attendance: 90, academics: 85 },
        { month: "Dec", attendance: attendancePercentage, academics: academicPercentage },
      ];

      setPerformance({
        attendance: {
          overall: attendancePercentage,
          trend: attendancePercentage >= 85 ? "up" : attendancePercentage >= 75 ? "stable" : "down",
          bySubject: [], // Would calculate per subject in full implementation
        },
        academics: {
          overall: academicPercentage,
          trend: academicPercentage >= 70 ? "up" : academicPercentage >= 50 ? "stable" : "down",
          bySubject: [],
        },
        submissions: {
          total: totalSubmissions,
          onTime: onTimeSubmissions,
          late: lateSubmissions,
        },
        monthlyTrend,
      });
    } catch (error) {
      console.error("Error fetching performance:", error);
      toast({
        title: "Error",
        description: "Failed to load performance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "down":
        return <TrendingDown className="h-5 w-5 text-destructive" />;
      default:
        return <Target className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { label: "Excellent", color: "text-green-500" };
    if (percentage >= 75) return { label: "Good", color: "text-blue-500" };
    if (percentage >= 60) return { label: "Average", color: "text-yellow-500" };
    return { label: "Needs Improvement", color: "text-destructive" };
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
        <h1 className="text-2xl font-bold text-foreground">My Performance</h1>
        <p className="text-muted-foreground">Track your academic progress and attendance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Attendance</CardTitle>
              {getTrendIcon(performance.attendance.trend)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{performance.attendance.overall}%</div>
            <Progress 
              value={performance.attendance.overall} 
              className={`mt-2 ${performance.attendance.overall < 75 ? "[&>div]:bg-destructive" : ""}`}
            />
            <p className={`text-sm mt-2 ${getPerformanceLevel(performance.attendance.overall).color}`}>
              {getPerformanceLevel(performance.attendance.overall).label}
            </p>
            {performance.attendance.overall < 75 && (
              <div className="flex items-center gap-1 text-xs text-destructive mt-2">
                <AlertTriangle className="h-3 w-3" />
                Below minimum 75% requirement
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Academic Score</CardTitle>
              {getTrendIcon(performance.academics.trend)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{performance.academics.overall}%</div>
            <Progress value={performance.academics.overall} className="mt-2" />
            <p className={`text-sm mt-2 ${getPerformanceLevel(performance.academics.overall).color}`}>
              {getPerformanceLevel(performance.academics.overall).label}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submission Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{performance.submissions.total}</div>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-green-500">{performance.submissions.onTime} On Time</span>
              <span className="text-yellow-500">{performance.submissions.late} Late</span>
            </div>
            {performance.submissions.total > 0 && (
              <Progress 
                value={(performance.submissions.onTime / performance.submissions.total) * 100} 
                className="mt-2"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
          <CardDescription>Your attendance and academic performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performance.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-muted-foreground" />
                <YAxis domain={[0, 100]} className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="attendance" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Attendance %"
                />
                <Line 
                  type="monotone" 
                  dataKey="academics" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Academic %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Current Attendance</span>
                <Badge 
                  variant={performance.attendance.overall >= 75 ? "default" : "destructive"}
                >
                  {performance.attendance.overall}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Required Minimum</span>
                <span className="font-medium">75%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                {performance.attendance.overall >= 75 ? (
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                    On Track
                  </Badge>
                ) : (
                  <Badge variant="destructive">At Risk</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Academic Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Current Score</span>
                <Badge>{performance.academics.overall}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Grade</span>
                <span className="font-medium">
                  {performance.academics.overall >= 90 ? "A+" :
                   performance.academics.overall >= 80 ? "A" :
                   performance.academics.overall >= 70 ? "B" :
                   performance.academics.overall >= 60 ? "C" :
                   performance.academics.overall >= 50 ? "D" : "F"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Performance</span>
                <span className={getPerformanceLevel(performance.academics.overall).color}>
                  {getPerformanceLevel(performance.academics.overall).label}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
