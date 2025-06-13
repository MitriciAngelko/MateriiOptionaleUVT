import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isSecretar } from '../../utils/userRoles';

const SecretarRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSecretar = async () => {
      if (!user) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const secretarStatus = await isSecretar(user.uid);
        setIsAuthorized(secretarStatus);
      } catch (error) {
        console.error('Error checking secretar status:', error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkSecretar();
  }, [user]);

  // Show loading state while checking
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Verificare autorizare...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!isAuthorized) {
    return <Navigate to="/" />;
  }

  return children;
};

export default SecretarRoute; 