import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import AdminRoute from './components/AdminRoute';
import PrivateRoute from './components/PrivateRoute';
import AdminMateriiPage from './pages/AdminMateriiPage';
import MateriileMelePage from './pages/MateriileMelePage';

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-gray-100">
      {!isLoginPage && <Navbar />}
      <div className={!isLoginPage ? 'pt-16' : ''}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          
          {/* Rută protejată pentru profil */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          
          {/* Rută protejată pentru materiile profesorului */}
          <Route
            path="/materiile-mele"
            element={
              <PrivateRoute>
                <MateriileMelePage />
              </PrivateRoute>
            }
          />
          
          {/* Rute protejate pentru admin */}
          <Route
            path="/admin-utilizatori"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin-materii"
            element={
              <AdminRoute>
                <AdminMateriiPage />
              </AdminRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;