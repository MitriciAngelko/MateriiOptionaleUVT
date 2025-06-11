import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import store from './store';
import Navbar from './components/Navbar';
import LoginPage from './pages/auth/LoginPage';
import HomePage from './pages/HomePage';
import AdminPage from './pages/admin/AdminPage';
import ProfilePage from './pages/ProfilePage';
import AdminRoute from './components/admin/AdminRoute';
import PrivateRoute from './components/PrivateRoute';
import AdminMateriiPage from './pages/admin/AdminMateriiPage';
import ProfesorMateriileMelePage from './pages/profesor/MateriileMelePage';
import StudentMateriileMelePage from './pages/student/MateriileMelePage';
import InscriereMateriiPage from './pages/student/InscriereMateriiPage';
import MateriiStudentPage from './pages/student/MateriiStudentPage';
import AdminIstoricAcademicPage from './pages/admin/AdminIstoricAcademicPage';
import AlocareAutomataPage from './pages/admin/AlocareAutomataPage';
import RegistrationSettingsPage from './pages/admin/RegistrationSettingsPage';
import MateriiProvider from './contexts/MateriiContext';


function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const user = useSelector((state) => state.auth.user);
  // Special check for main admin
  const isMainAdmin = user?.email === 'admin@admin.com';
  // Keep simple email check for initial navigation - AdminRoute will handle proper authorization
  const isAdminEmail = isMainAdmin || user?.email?.endsWith('@admin.com');


  return (
    <MateriiProvider>
      <div className="min-h-screen bg-gray-100">
        {!isLoginPage && <Navbar />}
        <div className={!isLoginPage ? 'pt-16' : ''}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />

            
            {/* Redirecționare condiționată pentru ruta principală */}
            <Route 
              path="/" 
              element={
                isAdminEmail ? (
                  <Navigate to="/admin-utilizatori" replace />
                ) : (
                  <HomePage />
                )
              } 
            />
            <Route 
              path="/home" 
              element={
                isAdminEmail ? (
                  <Navigate to="/admin-utilizatori" replace />
                ) : (
                  <HomePage />
                )
              } 
            />

            {/* Rută protejată pentru profil */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            
            {/* Rute separate pentru materiile mele - profesor vs student */}
            <Route
              path="/materiile-mele-profesor"
              element={
                <PrivateRoute>
                  <ProfesorMateriileMelePage />
                </PrivateRoute>
              }
            />
            
            {/* Rută pentru materiile mele - student */}
            <Route
              path="/materiile-mele"
              element={
                <PrivateRoute>
                  <StudentMateriileMelePage />
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
            <Route
              path="/inscriere-materii"
              element={
                <PrivateRoute>
                  <InscriereMateriiPage />
                </PrivateRoute>
              }
            />
            <Route 
              path="/materiile-studentului" 
              element={
                <PrivateRoute>
                  <MateriiStudentPage />
                </PrivateRoute>
              } 
            />
            <Route
              path="/istoric-academic"
              element={
                <AdminRoute>
                  <AdminIstoricAcademicPage />
                </AdminRoute>
              }
            />
            <Route
              path="/alocare-automata"
              element={<AdminRoute><AlocareAutomataPage /></AdminRoute>}
            />
            <Route
              path="/registration-settings"
              element={<AdminRoute><RegistrationSettingsPage /></AdminRoute>}
            />
          </Routes>
        </div>
      </div>
    </MateriiProvider>
  );
}

export default App;