import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!user.email?.endsWith('@admin.com')) {
    return <Navigate to="/" />;
  }

  // Redirecționează admin-ul de pe home page direct la pagina de utilizatori
  if (location.pathname === '/' || location.pathname === '/home') {
    return <Navigate to="/admin-utilizatori" />;
  }

  return children;
};

export default AdminRoute; 