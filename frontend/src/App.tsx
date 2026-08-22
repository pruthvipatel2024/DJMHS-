import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Auth & Protection Guards
import LoginPage from './features/auth/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './features/auth/AuthContext';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import TeacherLayout from './layouts/TeacherLayout';
import PortalLayout from './layouts/PortalLayout';

// Dashboards & Core
import AdminDashboard from './features/dashboard/AdminDashboard';
import TeacherDashboard from './features/dashboard/TeacherDashboard';
import PortalDashboard from './features/dashboard/PortalDashboard';
import SettingsPage from './features/settings/SettingsPage';

// Staff & HR
import StaffListPage from './features/staff/StaffListPage';
import StaffProfilePage from './features/staff/StaffProfilePage';

// Students & General Register
import StudentListPage from './features/students/StudentListPage';
import StudentProfilePage from './features/students/StudentProfilePage';
import CertificatesPage from './features/students/CertificatesPage';

// Attendance
import AttendanceRegisterPage from './features/attendance/AttendanceRegisterPage';
import AttendanceReportPage from './features/attendance/AttendanceReportPage';

// Examinations & Results
import ExamListPage from './features/exams/ExamListPage';
import ExamMarksEntryPage from './features/exams/ExamMarksEntryPage';

// Timetables & Scheduling
import TimetablePage from './features/timetables/TimetablePage';

// Fee Management & Treasury
import FeeCollectionPage from './features/fees/FeeCollectionPage';

// CRM, Grievances & Circulars
import InquiriesPage from './features/crm/InquiriesPage';
import ComplaintsPage from './features/crm/ComplaintsPage';
import AnnouncementsPage from './features/crm/AnnouncementsPage';
import SessionManagerPage from './features/auth/SessionManagerPage';

// Dynamic Root Redirect Guard based on authentication status & user role
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role.name === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role.name === 'TEACHER') return <Navigate to="/teacher/dashboard" replace />;
  return <Navigate to="/portal/dashboard" replace />;
};

const App: React.FC = () => {
  return (
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
  );
};

export default App;
