import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Auth & Protection Guards
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './features/auth/AuthContext';
import LoadingSkeleton from './components/States/LoadingSkeleton';

// Layouts (Fast eager loaded for structural frame)
import AdminLayout from './layouts/AdminLayout';
import TeacherLayout from './layouts/TeacherLayout';
import PortalLayout from './layouts/PortalLayout';

// Lazy Loaded Pages for Instant 0-Latency Code-Splitting
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const AdminDashboard = lazy(() => import('./features/dashboard/AdminDashboard'));
const TeacherDashboard = lazy(() => import('./features/dashboard/TeacherDashboard'));
const PortalDashboard = lazy(() => import('./features/dashboard/PortalDashboard'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));

// Staff & HR
const StaffListPage = lazy(() => import('./features/staff/StaffListPage'));
const StaffProfilePage = lazy(() => import('./features/staff/StaffProfilePage'));

// Students & General Register
const StudentListPage = lazy(() => import('./features/students/StudentListPage'));
const StudentProfilePage = lazy(() => import('./features/students/StudentProfilePage'));
const CertificatesPage = lazy(() => import('./features/students/CertificatesPage'));

// Attendance
const AttendanceRegisterPage = lazy(() => import('./features/attendance/AttendanceRegisterPage'));
const AttendanceReportPage = lazy(() => import('./features/attendance/AttendanceReportPage'));

// Examinations & Results
const ExamListPage = lazy(() => import('./features/exams/ExamListPage'));
const ExamMarksEntryPage = lazy(() => import('./features/exams/ExamMarksEntryPage'));

// Timetables & Scheduling
const TimetablePage = lazy(() => import('./features/timetables/TimetablePage'));

// Fee Management & Treasury
const FeeCollectionPage = lazy(() => import('./features/fees/FeeCollectionPage'));

// CRM, Grievances & Circulars
const InquiriesPage = lazy(() => import('./features/crm/InquiriesPage'));
const ComplaintsPage = lazy(() => import('./features/crm/ComplaintsPage'));
const AnnouncementsPage = lazy(() => import('./features/crm/AnnouncementsPage'));
const SessionManagerPage = lazy(() => import('./features/auth/SessionManagerPage'));

// Institutional Page Fallback Skeleton
const PageFallback: React.FC = () => (
  <div className="p-6 max-w-6xl mx-auto space-y-6 animate-pulse">
    <div className="h-24 bg-slate-100 rounded-3xl"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-28 bg-slate-100 rounded-2xl"></div>
      ))}
    </div>
    <LoadingSkeleton rows={4} />
  </div>
);

// Dynamic Root Redirect Guard based on authentication status & user role
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  const userRole = typeof user.role === 'string' ? user.role : (user.role?.name || '');
  if (userRole === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (userRole === 'TEACHER') return <Navigate to="/teacher/dashboard" replace />;
  return <Navigate to="/portal/dashboard" replace />;
};

const App: React.FC = () => {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Dynamic Root Route */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* ADMIN CONSOLE ROUTE BRANCH */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="sessions" element={<SessionManagerPage />} />
          <Route path="reports" element={<AttendanceReportPage />} />
          
          {/* Personnel & HR */}
          <Route path="staff" element={<StaffListPage />} />
          <Route path="staff/:id" element={<StaffProfilePage />} />
          
          {/* Student Register */}
          <Route path="students" element={<StudentListPage />} />
          <Route path="students/:id" element={<StudentProfilePage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          
          {/* Academic & Attendance */}
          <Route path="attendance" element={<AttendanceRegisterPage />} />
          <Route path="attendance-report" element={<AttendanceReportPage />} />
          <Route path="exams" element={<ExamListPage />} />
          <Route path="exams/marksheet" element={<ExamMarksEntryPage />} />
          <Route path="timetables" element={<TimetablePage />} />
          
          {/* Financial Accounts */}
          <Route path="fees" element={<FeeCollectionPage />} />
          
          {/* CRM & Helpdesk */}
          <Route path="inquiries" element={<InquiriesPage />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
        </Route>

        {/* FACULTY TEACHER CONSOLE BRANCH */}
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboard />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="attendance" element={<AttendanceRegisterPage />} />
          <Route path="exams/marksheet" element={<ExamMarksEntryPage />} />
          <Route path="timetables" element={<TimetablePage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
        </Route>

        {/* STUDENT & PARENT WEB PORTAL BRANCH (With Sibling Switcher Integration) */}
        <Route
          path="/portal/*"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'PARENT']}>
              <PortalLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PortalDashboard />} />
          <Route path="dashboard" element={<PortalDashboard />} />
          <Route path="attendance" element={<AttendanceReportPage />} />
          <Route path="exams" element={<ExamListPage />} />
          <Route path="fees" element={<FeeCollectionPage />} />
          <Route path="timetables" element={<TimetablePage />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
        </Route>

        {/* Catch-all fallback redirect */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Suspense>
  );
};

export default App;
