import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Layouts
import { StudentLayout } from "@/components/layout/StudentLayout";
import { FacultyLayout } from "@/components/layout/FacultyLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

// Auth Pages
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";

// Student Pages
import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentAttendance from "@/pages/student/StudentAttendance";
import StudentTimetable from "@/pages/student/StudentTimetable";
import StudentMarkAttendance from "@/pages/student/StudentMarkAttendance";
import StudentAssignments from "@/pages/student/StudentAssignments";
import StudentMarks from "@/pages/student/StudentMarks";
import StudentPerformance from "@/pages/student/StudentPerformance";
import StudentNotifications from "@/pages/student/StudentNotifications";

// Faculty Pages
import FacultyDashboard from "@/pages/faculty/FacultyDashboard";
import FacultySubjects from "@/pages/faculty/FacultySubjects";
import FacultyAttendance from "@/pages/faculty/FacultyAttendance";
import FacultyTimetable from "@/pages/faculty/FacultyTimetable";
import FacultyAssignments from "@/pages/faculty/FacultyAssignments";
import FacultyGrading from "@/pages/faculty/FacultyGrading";
import FacultyMarksEntry from "@/pages/faculty/FacultyMarksEntry";
import FacultyAnalytics from "@/pages/faculty/FacultyAnalytics";
import FacultyNotifications from "@/pages/faculty/FacultyNotifications";
import FacultyProfile from "@/pages/faculty/FacultyProfile";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminStudents from "@/pages/admin/AdminStudents";
import AdminFaculty from "@/pages/admin/AdminFaculty";
import AdminDepartments from "@/pages/admin/AdminDepartments";
import AdminPrograms from "@/pages/admin/AdminPrograms";
import AdminSubjects from "@/pages/admin/AdminSubjects";
import AdminTimetables from "@/pages/admin/AdminTimetables";
import AdminTimetableGrid from "@/pages/admin/AdminTimetableGrid";
import AdminSections from "@/pages/admin/AdminSections";
import AdminRooms from "@/pages/admin/AdminRooms";
import AdminFacultyAssignment from "@/pages/admin/AdminFacultyAssignment";
import AdminGeoZones from "@/pages/admin/AdminGeoZones";
import AdminAttendanceRules from "@/pages/admin/AdminAttendanceRules";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminAIAnalytics from "@/pages/admin/AdminAIAnalytics";
import AdminAuditLogs from "@/pages/admin/AdminAuditLogs";
import AdminSettings from "@/pages/admin/AdminSettings";
import StudentTodayView from "@/pages/student/StudentTodayView";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/auth/login" replace />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />

            {/* Student Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentDashboard />} />
              <Route path="today" element={<StudentTodayView />} />
              <Route path="attendance" element={<StudentAttendance />} />
              <Route path="timetable" element={<StudentTimetable />} />
              <Route path="mark-attendance" element={<StudentMarkAttendance />} />
              <Route path="assignments" element={<StudentAssignments />} />
              <Route path="marks" element={<StudentMarks />} />
              <Route path="performance" element={<StudentPerformance />} />
              <Route path="notifications" element={<StudentNotifications />} />
            </Route>

            {/* Faculty Routes */}
            <Route
              path="/faculty"
              element={
                <ProtectedRoute allowedRoles={["faculty"]}>
                  <FacultyLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<FacultyDashboard />} />
              <Route path="subjects" element={<FacultySubjects />} />
              <Route path="attendance" element={<FacultyAttendance />} />
              <Route path="timetable" element={<FacultyTimetable />} />
              <Route path="assignments" element={<FacultyAssignments />} />
              <Route path="grading" element={<FacultyGrading />} />
              <Route path="marks-entry" element={<FacultyMarksEntry />} />
              <Route path="analytics" element={<FacultyAnalytics />} />
              <Route path="notifications" element={<FacultyNotifications />} />
              <Route path="profile" element={<FacultyProfile />} />
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users/students" element={<AdminStudents />} />
              <Route path="users/faculty" element={<AdminFaculty />} />
              <Route path="departments" element={<AdminDepartments />} />
              <Route path="programs" element={<AdminPrograms />} />
              <Route path="subjects" element={<AdminSubjects />} />
              <Route path="sections" element={<AdminSections />} />
              <Route path="rooms" element={<AdminRooms />} />
              <Route path="timetables" element={<AdminTimetables />} />
              <Route path="timetable-grid" element={<AdminTimetableGrid />} />
              <Route path="assign-faculty" element={<AdminFacultyAssignment />} />
              <Route path="geo-zones" element={<AdminGeoZones />} />
              <Route path="attendance-rules" element={<AdminAttendanceRules />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="ai-analytics" element={<AdminAIAnalytics />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
