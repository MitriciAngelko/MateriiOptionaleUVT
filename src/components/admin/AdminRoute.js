import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isAdmin, isSecretar } from '../../utils/userRoles';

const AdminRoute = ({ children, allowSecretar = false }) => {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Special case for admin@admin.com - immediate access
  const isMainAdmin = user?.email === 'admin@admin.com';

  useEffect(() => {
    const checkAccess = async () => {
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
        // Check admin status - pass the userId for consistency with other role checks
        const adminStatus = await isAdmin(user.uid);
        
        // If allowSecretar is true, also check for secretar role
        let secretarStatus = false;
        if (allowSecretar) {
          secretarStatus = await isSecretar(user.uid);
        }
        
        const hasAccess = adminStatus || secretarStatus;
        setIsAuthorized(hasAccess);
      } catch (error) {
        console.error('AdminRoute: Error checking access status:', error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, isMainAdmin, allowSecretar]);

  // Show loading state while checking for all users
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-dark-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#024A76] dark:border-blue-light mx-auto mb-4"></div>
          <p className="text-[#024A76] dark:text-blue-light font-medium">Se încarcă...</p>
        </div>
      </div>
    );
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