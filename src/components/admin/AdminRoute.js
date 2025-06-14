import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasAdminAccess, debugUserPermissions } from '../../utils/userRoles';

const AdminRoute = ({ children, allowSecretar = true }) => {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Special case for admin@admin.com - immediate access
  const isMainAdmin = user?.email === 'admin@admin.com';

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        console.log('🚫 AdminRoute: No user found - redirecting to login');
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      console.log('🔍 AdminRoute: Starting access check', {
        path: location.pathname,
        userEmail: user.email,
        userUid: user.uid,
        allowSecretar,
        isMainAdmin
      });

      // Skip check for main admin account
      if (isMainAdmin) {
        console.log('✅ AdminRoute: Main admin detected - IMMEDIATE ACCESS GRANTED');
        setIsAuthorized(true);
        setLoading(false);
        return;
      }

      try {
        // Reset error state
        setError(null);
        
        // Use the new unified access control system
        // This checks both admin AND secretar access in one call
        const accessGranted = await hasAdminAccess(user);
        
        // Additional debug information
        if (process.env.NODE_ENV === 'development') {
          await debugUserPermissions(user);
        }
        
        setIsAuthorized(accessGranted);
        
        if (accessGranted) {
          console.log('✅ AdminRoute: ACCESS GRANTED for', user.email, 'to', location.pathname);
        } else {
          console.log('🚫 AdminRoute: ACCESS DENIED for', user.email, 'to', location.pathname);
        }
      } catch (error) {
        console.error('💥 AdminRoute: Error during access check:', error);
        setError(error.message);
        setIsAuthorized(false);
        
        // For main admin, grant access even if there are database errors
        if (isMainAdmin) {
          console.log('🆘 AdminRoute: Database error, but granting access to main admin');
          setIsAuthorized(true);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, isMainAdmin, allowSecretar, location.pathname]);

  // Show loading state while checking for all users
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-dark-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#024A76] dark:border-blue-light mx-auto mb-4"></div>
          <p className="text-[#024A76] dark:text-blue-light font-medium">
            Verificăm permisiunile...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {user?.email || 'Utilizator'}
          </p>
          {error && (
            <p className="text-xs text-red-500 mt-2">
              Problemă de conectare la baza de date...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🚫 AdminRoute: Redirecting to login - no user');
    return <Navigate to="/login" replace />;
  }

  // Special case for admin@admin.com - bypass other checks
  if (isMainAdmin) {
    // Redirect admin from home page directly to users page
    if (location.pathname === '/' || location.pathname === '/home') {
      console.log('🏠 AdminRoute: Redirecting main admin from home to admin-utilizatori');
      return <Navigate to="/admin-utilizatori" replace />;
    }
    return children;
  }

  if (!isAuthorized) {
    console.log('🚫 AdminRoute: FINAL REDIRECT - Access denied for', user.email);
    
    // Show a brief access denied message before redirect
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-dark-bg">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Acces restricționat
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Nu aveți permisiunea să accesați această pagină.
          </p>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-600 dark:text-red-400">
                <strong>Problemă tehnică:</strong> {error}
              </p>
              <p className="text-xs text-red-500 dark:text-red-500 mt-1">
                Contactați administratorul sistemului dacă problema persistă.
              </p>
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Conectat ca: {user.email}
          </p>
          <div className="mt-4">
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Înapoi la pagina principală
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Redirecționează utilizatorii cu acces de pe home page direct la pagina de utilizatori
  if (location.pathname === '/' || location.pathname === '/home') {
    console.log('🏠 AdminRoute: Redirecting authorized user from home to admin-utilizatori');
    return <Navigate to="/admin-utilizatori" replace />;
  }

  console.log('✅ AdminRoute: RENDERING COMPONENT - Access confirmed for', user.email);
  return children;
};

export default AdminRoute; 