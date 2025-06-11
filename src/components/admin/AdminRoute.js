import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isAdmin } from '../../utils/userRoles';

const AdminRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Special case for admin@admin.com - immediate access
  const isMainAdmin = user?.email === 'admin@admin.com';

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      // Skip check for main admin account
      if (isMainAdmin) {
        setIsAuthorized(true);
        setLoading(false);
        return;
      }

      try {
        const adminStatus = await isAdmin(user);
        setIsAuthorized(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, isMainAdmin]);

  // Show loading state while checking
  if (loading && !isMainAdmin) {
    return <div className="flex justify-center items-center h-screen">Verificare autorizare...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Special case for admin@admin.com - bypass other checks
  if (isMainAdmin) {
    // Redirect admin from home page directly to users page
    if (location.pathname === '/' || location.pathname === '/home') {
      return <Navigate to="/admin-utilizatori" />;
    }
    return children;
  }

  if (!isAuthorized) {
    return <Navigate to="/" />;
  }

  // Redirecționează admin-ul de pe home page direct la pagina de utilizatori
  if (location.pathname === '/' || location.pathname === '/home') {
    return <Navigate to="/admin-utilizatori" />;
  }

  return children;
};

export default AdminRoute; 