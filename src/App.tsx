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
import FacultyAttendance from "@/pages/faculty/FacultyAttendance";
import FacultyTimetable from "@/pages/faculty/FacultyTimetable";
import FacultyAssignments from "@/pages/faculty/FacultyAssignments";
import FacultyGrading from "@/pages/faculty/FacultyGrading";
import FacultyAnalytics from "@/pages/faculty/FacultyAnalytics";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";

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
              <Route path="attendance" element={<FacultyAttendance />} />
              <Route path="timetable" element={<FacultyTimetable />} />
              <Route path="assignments" element={<FacultyAssignments />} />
              <Route path="grading" element={<FacultyGrading />} />
              <Route path="analytics" element={<FacultyAnalytics />} />
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
