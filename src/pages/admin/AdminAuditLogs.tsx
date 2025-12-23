import { useState } from "react";
import { FileText, Search, Filter, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockLogs = [
  { id: 1, action: "User Login", user: "admin@demo.com", role: "Admin", timestamp: "2024-01-15 10:30:00", details: "Successful login from 192.168.1.1" },
  { id: 2, action: "Student Created", user: "admin@demo.com", role: "Admin", timestamp: "2024-01-15 10:25:00", details: "Created student: Rahul Sharma (CS2021001)" },
  { id: 3, action: "Course Assignment", user: "admin@demo.com", role: "Admin", timestamp: "2024-01-15 10:20:00", details: "Assigned Dr. Singh to CS301" },
  { id: 4, action: "Attendance Session", user: "faculty@demo.com", role: "Faculty", timestamp: "2024-01-15 09:00:00", details: "Opened attendance for CS301" },
  { id: 5, action: "Timetable Updated", user: "admin@demo.com", role: "Admin", timestamp: "2024-01-14 16:00:00", details: "Modified Monday schedule" },
  { id: 6, action: "Geo Zone Created", user: "admin@demo.com", role: "Admin", timestamp: "2024-01-14 15:30:00", details: "Created zone: Room 101" },
  { id: 7, action: "Assignment Created", user: "faculty@demo.com", role: "Faculty", timestamp: "2024-01-14 14:00:00", details: "Created: Data Structures Lab 1" },
  { id: 8, action: "Grade Submitted", user: "faculty@demo.com", role: "Faculty", timestamp: "2024-01-14 12:00:00", details: "Graded 25 submissions for CS301" },
];

export default function AdminAuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action.toLowerCase().includes(actionFilter.toLowerCase());
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    if (action.includes("Login")) return <Badge variant="secondary">{action}</Badge>;
    if (action.includes("Created")) return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">{action}</Badge>;
    if (action.includes("Updated") || action.includes("Assignment")) return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">{action}</Badge>;
    if (action.includes("Deleted")) return <Badge variant="destructive">{action}</Badge>;
    return <Badge variant="outline">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Track all system activities and changes</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Activity Logs</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search logs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64" />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-40"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Filter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{log.timestamp}</div>
                  </TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell><Badge variant="outline">{log.role}</Badge></TableCell>
                  <TableCell className="max-w-md truncate">{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
