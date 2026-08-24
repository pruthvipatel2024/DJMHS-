import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import LoadingSkeleton from './States/LoadingSkeleton';
import FirstTimeChangePasswordModal from '../features/auth/FirstTimeChangePasswordModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-7xl">
          <LoadingSkeleton rows={6} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !token || !user) {
    // Redirect to login page and keep track of where the user was trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = typeof user.role === 'string' ? user.role : (user.role?.name || '');
  const isStaffRole = userRole === 'ADMIN' || userRole === 'TEACHER';

  // Enforced first-time login security protocol for Staff (Admin/Teacher) only:
  if (user.isFirstLogin && isStaffRole) {
    return (
      <>
        <FirstTimeChangePasswordModal />
        <div className="blur-xs pointer-events-none select-none">{children}</div>
      </>
    );
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // User is authenticated but does not have permission for the requested route.
    // Redirect to their respective landing dashboard.
    const defaultRedirect =
      userRole === 'ADMIN'
        ? '/admin/dashboard'
        : userRole === 'TEACHER'
        ? '/teacher/dashboard'
        : '/portal/dashboard';
    return <Navigate to={defaultRedirect} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
