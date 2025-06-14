import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/auth/LoginPage';
import HomePage from './pages/HomePage';
import AdminPage from './pages/admin/AdminPage';
import ProfilePage from './pages/ProfilePage';
import AdminRoute from './components/admin/AdminRoute';
import { PrivateRoute } from './components/common/RouteGuards';
import AdminMateriiPage from './pages/admin/AdminMateriiPage';
import ProfesorMateriileMelePage from './pages/profesor/MateriileMelePage';
import ProfesorMaterieDetailsPage from './pages/profesor/MaterieDetailsPage';
import StudentMateriileMelePage from './pages/student/MateriileMelePage';
import InscriereMateriiPage from './pages/student/InscriereMateriiPage';
import AdminIstoricAcademicPage from './pages/admin/AdminIstoricAcademicPage';
import AlocareAutomataPage from './pages/admin/AlocareAutomataPage';
import RegistrationSettingsPage from './pages/admin/RegistrationSettingsPage';
import StudentNextYearRegistrationPage from './pages/admin/StudentNextYearRegistrationPage';
import SecretarRoute from './components/secretar/SecretarRoute';
import SecretarAlocareAutomataPage from './pages/secretar/SecretarAlocareAutomataPage';
import SecretarStudentNextYearRegistrationPage from './pages/secretar/SecretarStudentNextYearRegistrationPage';
import { MateriiProvider } from './contexts/MateriiContext';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
        {!isLoginPage && <Navbar />}
        <main className={!isLoginPage ? "pt-16" : ""}>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
          <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          
          {/* Student Routes */}
          <Route path="/materiile-mele" element={
            <PrivateRoute>
              <MateriiProvider>
                <StudentMateriileMelePage />
              </MateriiProvider>
            </PrivateRoute>
          } />
          <Route path="/inscriere-materii" element={
            <PrivateRoute>
              <MateriiProvider>
                <InscriereMateriiPage />
              </MateriiProvider>
            </PrivateRoute>
          } />
          
          {/* Professor Routes */}
          <Route path="/materiile-mele-profesor" element={
            <PrivateRoute>
              <MateriiProvider>
                <ProfesorMateriileMelePage />
              </MateriiProvider>
            </PrivateRoute>
          } />
          <Route path="/profesor/materiile-mele" element={
            <PrivateRoute>
              <MateriiProvider>
                <ProfesorMateriileMelePage />
              </MateriiProvider>
            </PrivateRoute>
          } />
          <Route path="/profesor/materie/:materieId" element={
            <PrivateRoute>
              <MateriiProvider>
                <ProfesorMaterieDetailsPage />
              </MateriiProvider>
            </PrivateRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin-utilizatori" element={
            <AdminRoute>
              <MateriiProvider>
                <AdminPage />
              </MateriiProvider>
            </AdminRoute>
          } />
          <Route path="/admin-materii" element={
            <AdminRoute>
              <MateriiProvider>
                <AdminMateriiPage />
              </MateriiProvider>
            </AdminRoute>
          } />
          <Route path="/istoric-academic" element={
            <AdminRoute>
              <MateriiProvider>
                <AdminIstoricAcademicPage />
              </MateriiProvider>
            </AdminRoute>
          } />
          <Route path="/alocare-automata" element={<AdminRoute><AlocareAutomataPage /></AdminRoute>} />
          <Route path="/inscriere-anul-urmator" element={<AdminRoute><StudentNextYearRegistrationPage /></AdminRoute>} />
          <Route
            path="/registration-settings"
            element={<AdminRoute><RegistrationSettingsPage /></AdminRoute>}
          />
          
          {/* Secretar Routes */}
          <Route path="/secretar/alocare-automata" element={<SecretarRoute><SecretarAlocareAutomataPage /></SecretarRoute>} />
          <Route path="/secretar/inscriere-anul-urmator" element={<SecretarRoute><SecretarStudentNextYearRegistrationPage /></SecretarRoute>} />
        </Routes>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;