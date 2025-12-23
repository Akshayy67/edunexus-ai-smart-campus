import { CalendarCheck, FileText, Award, TrendingUp, Clock, QrCode } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { AIInsightsPanel } from "@/components/ai/AIInsightsPanel";
import { useAIInsights } from "@/hooks/useAIInsights";

export default function StudentDashboard() {
  const { 
    insights, 
    alerts, 
    riskScore, 
    loading, 
    generateInsights, 
    acknowledgeAlert, 
    markInsightRead 
  } = useAIInsights("student");

  // Mock data - will be replaced with real data
  const stats = {
    overallAttendance: 87,
    assignmentsDue: 3,
    upcomingClasses: 4,
    averageMarks: 78,
  };

  const upcomingClasses = [
    { subject: "Data Structures", time: "09:00 AM", room: "Room 204" },
    { subject: "Database Systems", time: "11:00 AM", room: "Room 301" },
    { subject: "Computer Networks", time: "02:00 PM", room: "Lab 102" },
  ];

  const pendingAssignments = [
    { title: "DSA Assignment 3", subject: "Data Structures", dueDate: "Dec 25, 2025" },
    { title: "ER Diagram Project", subject: "Database Systems", dueDate: "Dec 28, 2025" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's your academic overview.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 flex-wrap">
        <Button asChild>
          <Link to="/student/mark-attendance">
            <QrCode className="mr-2 h-4 w-4" />
            Mark Attendance
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/student/assignments">
            <FileText className="mr-2 h-4 w-4" />
            View Assignments
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overallAttendance}%</div>
            <Progress value={stats.overallAttendance} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments Due</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignmentsDue}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingClasses}</div>
            <p className="text-xs text-muted-foreground">Remaining today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Marks</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageMarks}%</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Classes & Assignments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Classes */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Classes</CardTitle>
              <CardDescription>Your schedule for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingClasses.map((cls, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{cls.subject}</p>
                      <p className="text-sm text-muted-foreground">{cls.room}</p>
                    </div>
                    <div className="text-sm font-medium">{cls.time}</div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4" asChild>
                <Link to="/student/timetable">View Full Timetable</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Pending Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Assignments</CardTitle>
              <CardDescription>Assignments due soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingAssignments.map((assignment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                    </div>
                    <div className="text-sm text-destructive font-medium">
                      Due: {assignment.dueDate}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4" asChild>
                <Link to="/student/assignments">View All Assignments</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Insights */}
        <div>
          <AIInsightsPanel
            insights={insights}
            alerts={alerts}
            riskScore={riskScore}
            loading={loading}
            onRefresh={generateInsights}
            onAcknowledgeAlert={acknowledgeAlert}
            onMarkRead={markInsightRead}
            userType="student"
          />
        </div>
      </div>
    </div>
  );
}
