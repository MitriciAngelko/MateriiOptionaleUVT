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
import MateriileMelePage from './pages/profesor/MateriileMelePage';
import InscriereMateriiPage from './pages/student/InscriereMateriiPage';
import MateriiStudentPage from './pages/student/MateriiStudentPage';
import AdminIstoricAcademicPage from './pages/admin/AdminIstoricAcademicPage';
import AlocareAutomataPage from './pages/admin/AlocareAutomataPage';


function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.email?.endsWith('@admin.com');


  return (
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
              isAdmin ? (
                <Navigate to="/admin-utilizatori" replace />
              ) : (
                <HomePage />
              )
            } 
          />
          <Route 
            path="/home" 
            element={
              isAdmin ? (
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
        </Routes>
      </div>
    </div>
  );
}

export default App;