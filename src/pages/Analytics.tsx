import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, Users, Award, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/StatsCard";

const performanceData = [
  { grade: "A+", students: 45, percentage: 15 },
  { grade: "A", students: 78, percentage: 26 },
  { grade: "B+", students: 62, percentage: 21 },
  { grade: "B", students: 54, percentage: 18 },
  { grade: "C+", students: 32, percentage: 11 },
  { grade: "C", students: 18, percentage: 6 },
  { grade: "D", students: 8, percentage: 3 },
  { grade: "F", students: 3, percentage: 1 },
];

const semesterTrend = [
  { semester: "Fall 2022", gpa: 3.2, attendance: 82 },
  { semester: "Spring 2023", gpa: 3.3, attendance: 85 },
  { semester: "Fall 2023", gpa: 3.4, attendance: 87 },
  { semester: "Spring 2024", gpa: 3.5, attendance: 89 },
  { semester: "Fall 2024", gpa: 3.6, attendance: 91 },
];

const departmentData = [
  { name: "Computer Science", value: 450, color: "hsl(var(--primary))" },
  { name: "Engineering", value: 380, color: "hsl(var(--secondary))" },
  { name: "Business", value: 320, color: "hsl(var(--muted))" },
  { name: "Arts", value: 180, color: "hsl(var(--accent))" },
];

const coursePerformance = [
  { course: "CS201", avgGrade: 85, passRate: 94 },
  { course: "CS301", avgGrade: 78, passRate: 88 },
  { course: "CS302", avgGrade: 82, passRate: 91 },
  { course: "CS401", avgGrade: 72, passRate: 82 },
  { course: "CS303", avgGrade: 76, passRate: 85 },
];

const Analytics = () => {
  return (
    <AppLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Performance insights and academic metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Average GPA"
          value="3.45"
          change={5}
          changeLabel="vs last semester"
          icon={Award}
        />
        <StatsCard
          title="Pass Rate"
          value="92%"
          change={3}
          changeLabel="improvement"
          icon={TrendingUp}
        />
        <StatsCard
          title="At-Risk Students"
          value="23"
          change={-15}
          changeLabel="reduced"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Top Performers"
          value="156"
          change={12}
          changeLabel="this semester"
          icon={Users}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Grade Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">Current semester overview</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="grade" 
                    axisLine={false} 
                    tickLine={false}
                    className="text-xs fill-muted-foreground"
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    className="text-xs fill-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar 
                    dataKey="students" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Semester Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Trend</CardTitle>
            <p className="text-sm text-muted-foreground">GPA and Attendance over time</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={semesterTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="semester" 
                    axisLine={false} 
                    tickLine={false}
                    className="text-xs fill-muted-foreground"
                  />
                  <YAxis 
                    yAxisId="left"
                    axisLine={false} 
                    tickLine={false}
                    className="text-xs fill-muted-foreground"
                    domain={[3, 4]}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    axisLine={false} 
                    tickLine={false}
                    className="text-xs fill-muted-foreground"
                    domain={[70, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="gpa" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                    name="GPA"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="attendance" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--secondary))" }}
                    name="Attendance %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Student Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">By department</p>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {departmentData.map((dept) => (
                <div key={dept.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: dept.color }}
                  />
                  <span className="text-xs text-muted-foreground truncate">
                    {dept.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Course Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Course Performance</CardTitle>
            <p className="text-sm text-muted-foreground">Average grades and pass rates</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coursePerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    type="number"
                    axisLine={false} 
                    tickLine={false}
                    className="text-xs fill-muted-foreground"
                    domain={[0, 100]}
                  />
                  <YAxis 
                    type="category"
                    dataKey="course"
                    axisLine={false} 
                    tickLine={false}
                    className="text-xs fill-muted-foreground"
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar 
                    dataKey="avgGrade" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                    name="Avg Grade"
                  />
                  <Bar 
                    dataKey="passRate" 
                    fill="hsl(var(--secondary))" 
                    radius={[0, 4, 4, 0]}
                    name="Pass Rate %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Analytics;
