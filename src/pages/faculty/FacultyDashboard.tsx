import { CalendarCheck, Users, FileText, TrendingUp, Clock, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function FacultyDashboard() {
  // Mock data - will be replaced with real data
  const stats = {
    totalStudents: 156,
    classesToday: 4,
    pendingGrading: 23,
    avgAttendance: 85,
  };

  const todaysClasses = [
    { subject: "Data Structures", batch: "CSE 2022", time: "09:00 AM", room: "Room 204", status: "upcoming" },
    { subject: "Data Structures", batch: "CSE 2023", time: "11:00 AM", room: "Room 301", status: "upcoming" },
    { subject: "Algorithms", batch: "CSE 2022", time: "02:00 PM", room: "Lab 102", status: "upcoming" },
  ];

  const pendingSubmissions = [
    { title: "DSA Assignment 2", subject: "Data Structures", submissions: 45, total: 52 },
    { title: "Algorithm Analysis", subject: "Algorithms", submissions: 38, total: 48 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Faculty Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage your classes, attendance, and assignments.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 flex-wrap">
        <Button asChild>
          <Link to="/faculty/attendance">
            <CalendarCheck className="mr-2 h-4 w-4" />
            Take Attendance
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/faculty/assignments">
            <Plus className="mr-2 h-4 w-4" />
            Create Assignment
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.classesToday}</div>
            <p className="text-xs text-muted-foreground">Scheduled sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingGrading}</div>
            <p className="text-xs text-muted-foreground">Submissions to grade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgAttendance}%</div>
            <p className="text-xs text-muted-foreground">Your subjects</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Classes */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Classes</CardTitle>
            <CardDescription>Your teaching schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaysClasses.map((cls, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{cls.subject}</p>
                      <Badge variant="outline">{cls.batch}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{cls.room}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{cls.time}</p>
                    <Button size="sm" variant="ghost" className="mt-1" asChild>
                      <Link to="/faculty/attendance">Take Attendance</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4" asChild>
              <Link to="/faculty/timetable">View Full Schedule</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Pending Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Submissions</CardTitle>
            <CardDescription>Assignments awaiting grading</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingSubmissions.map((assignment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {assignment.submissions}/{assignment.total} submitted
                    </p>
                    <Button size="sm" variant="ghost" className="mt-1" asChild>
                      <Link to="/faculty/grading">Grade Now</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4" asChild>
              <Link to="/faculty/assignments">View All Assignments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
