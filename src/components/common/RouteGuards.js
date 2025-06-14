import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Routes that don't require authentication
const publicRoutes = ['/login', '/register'];

/**
 * Route guard for public routes (login, register)
 * Redirects authenticated users to home
 */
export const PublicRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const currentPath = window.location.pathname;

  // If user is authenticated and trying to access a public route
  if (user && publicRoutes.includes(currentPath)) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

/**
 * Route guard for private routes
 * Redirects unauthenticated users to login
 */
export const PrivateRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const currentPath = window.location.pathname;

  // If user is not authenticated and trying to access a private route
  if (!user && !publicRoutes.includes(currentPath)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}; 