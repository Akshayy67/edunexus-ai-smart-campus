import { useState } from "react";
import { 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface AttendanceRecord {
  id: string;
  studentName: string;
  studentId: string;
  course: string;
  checkInTime: string;
  status: "present" | "absent" | "late";
  location: string;
}

const attendanceRecords: AttendanceRecord[] = [
  { id: "1", studentName: "John Smith", studentId: "STU001", course: "CS201", checkInTime: "09:02 AM", status: "present", location: "Room 301" },
  { id: "2", studentName: "Emily Johnson", studentId: "STU002", course: "CS201", checkInTime: "09:15 AM", status: "late", location: "Room 301" },
  { id: "3", studentName: "Michael Brown", studentId: "STU003", course: "CS201", checkInTime: "-", status: "absent", location: "-" },
  { id: "4", studentName: "Sarah Davis", studentId: "STU004", course: "CS201", checkInTime: "08:58 AM", status: "present", location: "Room 301" },
  { id: "5", studentName: "James Wilson", studentId: "STU005", course: "CS201", checkInTime: "09:01 AM", status: "present", location: "Room 301" },
  { id: "6", studentName: "Emma Martinez", studentId: "STU006", course: "CS201", checkInTime: "09:20 AM", status: "late", location: "Room 301" },
  { id: "7", studentName: "Daniel Taylor", studentId: "STU007", course: "CS201", checkInTime: "08:55 AM", status: "present", location: "Room 301" },
  { id: "8", studentName: "Olivia Anderson", studentId: "STU008", course: "CS201", checkInTime: "-", status: "absent", location: "-" },
];

const statusConfig = {
  present: { label: "Present", variant: "default" as const, icon: CheckCircle2, color: "text-emerald-500" },
  late: { label: "Late", variant: "secondary" as const, icon: Clock, color: "text-amber-500" },
  absent: { label: "Absent", variant: "destructive" as const, icon: XCircle, color: "text-destructive" },
};

const Attendance = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const presentCount = attendanceRecords.filter(r => r.status === "present").length;
  const lateCount = attendanceRecords.filter(r => r.status === "late").length;
  const absentCount = attendanceRecords.filter(r => r.status === "absent").length;
  const totalCount = attendanceRecords.length;

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground mt-1">
            Real-time geo-fence attendance tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-emerald-500">{presentCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Late</p>
                <p className="text-2xl font-bold text-amber-500">{lateCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-destructive">{absentCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold">{Math.round(((presentCount + lateCount) / totalCount) * 100)}%</p>
              </div>
              <Users className="h-8 w-8 text-primary/20" />
            </div>
            <Progress value={((presentCount + lateCount) / totalCount) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select defaultValue="all">
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="cs201">CS201 - Data Structures</SelectItem>
                <SelectItem value="cs301">CS301 - Database Systems</SelectItem>
                <SelectItem value="cs401">CS401 - Machine Learning</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Live Attendance - CS201 (Data Structures)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Check-in Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Location</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => {
                  const config = statusConfig[record.status];
                  const StatusIcon = config.icon;

                  return (
                    <tr key={record.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium">{record.studentName}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{record.studentId}</td>
                      <td className="py-3 px-4 text-sm">{record.checkInTime}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{record.location}</td>
                      <td className="py-3 px-4">
                        <Badge variant={config.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Attendance;
