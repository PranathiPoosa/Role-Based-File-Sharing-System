// components/ProtectedRoute.js - Route guard based on authentication and roles
import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUser, isAuthenticated } from '../utils/auth';

/**
 * ProtectedRoute component
 * Redirects to login if not authenticated
 * Redirects to appropriate dashboard if role doesn't match
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = getUser();
  const authenticated = isAuthenticated();

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardMap = {
      admin: '/admin',
      manager: '/manager',
      user: '/dashboard',
    };
    return <Navigate to={dashboardMap[user.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
