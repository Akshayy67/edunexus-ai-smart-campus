import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, TrendingUp, Calendar, FileText, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface CourseStats {
  id: string;
  name: string;
  code: string;
  totalStudents: number;
  averageAttendance: number;
  averageMarks: number;
  submissionRate: number;
}

export default function FacultyAnalytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseStats[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [overallStats, setOverallStats] = useState({
    totalStudents: 0,
    averageAttendance: 0,
    totalAssessments: 0,
    pendingGrading: 0,
  });

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      // Get faculty record
      const { data: facultyData } = await supabase
        .from("faculty")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!facultyData) {
        setLoading(false);
        return;
      }

      // Fetch courses
      const { data: assignments } = await supabase
        .from("course_assignments")
        .select("course_id")
        .eq("faculty_id", facultyData.id);

      if (!assignments || assignments.length === 0) {
        setLoading(false);
        return;
      }

      const courseIds = assignments.map((a) => a.course_id).filter(Boolean) as string[];

      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, name, code")
        .in("id", courseIds);

      // Mock analytics data - in production, calculate from actual data
      const courseStats: CourseStats[] = (coursesData || []).map((course) => ({
        id: course.id,
        name: course.name,
        code: course.code,
        totalStudents: Math.floor(Math.random() * 50) + 30,
        averageAttendance: Math.floor(Math.random() * 20) + 75,
        averageMarks: Math.floor(Math.random() * 25) + 60,
        submissionRate: Math.floor(Math.random() * 15) + 80,
      }));

      setCourses(courseStats);

      // Fetch assessments count
      const { count: assessmentsCount } = await supabase
        .from("assessments")
        .select("*", { count: "exact", head: true })
        .eq("faculty_id", facultyData.id);

      // Fetch pending grading
      const { data: myAssessments } = await supabase
        .from("assessments")
        .select("id")
        .eq("faculty_id", facultyData.id);

      let pendingCount = 0;
      if (myAssessments && myAssessments.length > 0) {
        const { count } = await supabase
          .from("assessment_submissions")
          .select("*", { count: "exact", head: true })
          .in("assessment_id", myAssessments.map((a) => a.id))
          .neq("status", "graded");
        pendingCount = count || 0;
      }

      setOverallStats({
        totalStudents: courseStats.reduce((sum, c) => sum + c.totalStudents, 0),
        averageAttendance: Math.round(
          courseStats.reduce((sum, c) => sum + c.averageAttendance, 0) / (courseStats.length || 1)
        ),
        totalAssessments: assessmentsCount || 0,
        pendingGrading: pendingCount,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

  const attendanceData = courses.map((c) => ({
    name: c.code,
    attendance: c.averageAttendance,
  }));

  const performanceData = courses.map((c) => ({
    name: c.code,
    marks: c.averageMarks,
  }));

  const pieData = [
    { name: "On-time", value: 75 },
    { name: "Late", value: 15 },
    { name: "Absent", value: 10 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">View performance metrics for your classes</p>
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{overallStats.totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Avg Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{overallStats.averageAttendance}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{overallStats.totalAssessments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Pending Grading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">{overallStats.pendingGrading}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance by Course</CardTitle>
            <CardDescription>Average attendance percentage per course</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-muted-foreground" />
                  <YAxis domain={[0, 100]} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="attendance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance by Course</CardTitle>
            <CardDescription>Average marks percentage per course</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-muted-foreground" />
                  <YAxis domain={[0, 100]} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="marks" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Breakdown</CardTitle>
          <CardDescription>Overall student attendance distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="h-64 w-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="ml-8 space-y-2">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Details */}
      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
          <CardDescription>Detailed metrics for each course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{course.name}</span>
                    <Badge variant="outline">{course.code}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {course.totalStudents} students enrolled
                  </p>
                </div>
                <div className="flex gap-8 text-sm">
                  <div className="text-center">
                    <div className="text-muted-foreground">Attendance</div>
                    <div className={`font-bold ${course.averageAttendance >= 75 ? "text-green-500" : "text-destructive"}`}>
                      {course.averageAttendance}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Avg Marks</div>
                    <div className="font-bold text-foreground">{course.averageMarks}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Submissions</div>
                    <div className="font-bold text-foreground">{course.submissionRate}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
