import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, token, checkAuth } = useStore();
  const location = useLocation();

  useEffect(() => {
    if (token && !user) {
      checkAuth();
    }
  }, [token, user, checkAuth]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show a clean loading indicator while checking auth details
  if (token && !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span className="text-xs font-medium text-slate-500">Checking credentials...</span>
        </div>
      </div>
    );
  }

  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    // Role mismatch, redirect to appropriate role dashboard or login
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
