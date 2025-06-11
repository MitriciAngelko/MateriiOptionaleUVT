// src/components/RouteGuard.js
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Rute care nu necesită autentificare
const publicRoutes = ['/login', '/register'];

export const PublicRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const currentPath = window.location.pathname;

  // Dacă utilizatorul este autentificat și încearcă să acceseze o rută publică
  if (user && publicRoutes.includes(currentPath)) {
    return <Navigate to="/home" />;
  }

  return children;
};

export const PrivateRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const currentPath = window.location.pathname;

  // Dacă utilizatorul nu este autentificat și încearcă să acceseze o rută privată
  if (!user && !publicRoutes.includes(currentPath)) {
    return <Navigate to="/login" />;
  }

  return children;
};