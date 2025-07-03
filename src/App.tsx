
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

// Auth pages
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";

// Protected pages
import Dashboard from "@/pages/Dashboard";
import SubjectLessons from "@/pages/SubjectLessons";
import LessonDetail from "@/pages/LessonDetail";
import Practice from "@/pages/Practice";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";

// Admin pages
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminCourses from "@/pages/admin/AdminCourses";
import AdminStudents from "@/pages/admin/AdminStudents";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={
            <AdminAuthProvider>
              <AdminLogin />
            </AdminAuthProvider>
          } />
          <Route path="/admin/*" element={
            <AdminAuthProvider>
              <Routes>
                <Route path="dashboard" element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                } />
                <Route path="courses" element={
                  <AdminProtectedRoute>
                    <AdminCourses />
                  </AdminProtectedRoute>
                } />
                <Route path="students" element={
                  <AdminProtectedRoute>
                    <AdminStudents />
                  </AdminProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </AdminAuthProvider>
          } />

          {/* Student routes */}
          <Route path="/*" element={
            <AuthProvider>
              <Routes>
                <Route path="dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="dashboard/:subjectId" element={
                  <ProtectedRoute>
                    <SubjectLessons />
                  </ProtectedRoute>
                } />
                <Route path="dashboard/:subjectId/lesson/:lessonId" element={
                  <ProtectedRoute>
                    <LessonDetail />
                  </ProtectedRoute>
                } />
                <Route path="dashboard/:subjectId/practice" element={
                  <ProtectedRoute>
                    <Practice />
                  </ProtectedRoute>
                } />
                <Route path="dashboard/practice" element={
                  <ProtectedRoute>
                    <Practice />
                  </ProtectedRoute>
                } />
                <Route path="dashboard/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
