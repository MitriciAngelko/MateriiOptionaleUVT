import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!user.email?.endsWith('@admin.com')) {
    return <Navigate to="/" />;
  }

  return children;
};

export default AdminRoute; 