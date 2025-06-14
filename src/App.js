import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import { PrivateRoute } from './components/common/RouteGuards';
import AdminRoute from './components/admin/AdminRoute';
import { MateriiProvider } from './contexts/MateriiContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load components to reduce initial bundle size
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Admin pages
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const AdminMateriiPage = lazy(() => import('./pages/admin/AdminMateriiPage'));
const AdminIstoricAcademicPage = lazy(() => import('./pages/admin/AdminIstoricAcademicPage'));
const AlocareAutomataPage = lazy(() => import('./pages/admin/AlocareAutomataPage'));
const RegistrationSettingsPage = lazy(() => import('./pages/admin/RegistrationSettingsPage'));
const StudentNextYearRegistrationPage = lazy(() => import('./pages/admin/StudentNextYearRegistrationPage'));

// Student pages
const StudentMateriileMelePage = lazy(() => import('./pages/student/MateriileMelePage'));
const InscriereMateriiPage = lazy(() => import('./pages/student/InscriereMateriiPage'));

// Professor pages
const ProfesorMateriileMelePage = lazy(() => import('./pages/profesor/MateriileMelePage'));
const ProfesorMaterieDetailsPage = lazy(() => import('./pages/profesor/MaterieDetailsPage'));

// Custom loading component for better UX
const PageLoadingFallback = ({ pageName }) => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
        Loading {pageName}...
      </p>
    </div>
  </div>
);

// High-Order Component for wrapping lazy components with context providers
const withMateriiProvider = (Component) => {
  return (props) => (
    <MateriiProvider>
      <Component {...props} />
    </MateriiProvider>
  );
};

// Wrap components that need MateriiProvider
const StudentMateriileMelePageWithProvider = withMateriiProvider(StudentMateriileMelePage);
const InscriereMateriiPageWithProvider = withMateriiProvider(InscriereMateriiPage);
const ProfesorMateriileMelePageWithProvider = withMateriiProvider(ProfesorMateriileMelePage);
const ProfesorMaterieDetailsPageWithProvider = withMateriiProvider(ProfesorMaterieDetailsPage);
const AdminPageWithProvider = withMateriiProvider(AdminPage);
const AdminMateriiPageWithProvider = withMateriiProvider(AdminMateriiPage);
const AdminIstoricAcademicPageWithProvider = withMateriiProvider(AdminIstoricAcademicPage);

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
        {!isLoginPage && <Navbar />}
        <main className={!isLoginPage ? "lg:pt-16" : ""}>
          <Routes>
            <Route 
              path="/login" 
              element={
                <Suspense fallback={<PageLoadingFallback pageName="Login" />}>
                  <LoginPage />
                </Suspense>
              } 
            />
            
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Suspense fallback={<PageLoadingFallback pageName="Home" />}>
                    <HomePage />
                  </Suspense>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/home" 
              element={
                <PrivateRoute>
                  <Suspense fallback={<PageLoadingFallback pageName="Home" />}>
                    <HomePage />
                  </Suspense>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <Suspense fallback={<PageLoadingFallback pageName="Profile" />}>
                    <ProfilePage />
                  </Suspense>
                </PrivateRoute>
              } 
            />
          
            {/* Student Routes */}
            <Route 
              path="/materiile-mele" 
              element={
                <PrivateRoute>
                  <Suspense fallback={<PageLoadingFallback pageName="My Courses" />}>
                    <StudentMateriileMelePageWithProvider />
                  </Suspense>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/inscriere-materii" 
              element={
                <PrivateRoute>
                  <Suspense fallback={<PageLoadingFallback pageName="Course Registration" />}>
                    <InscriereMateriiPageWithProvider />
                  </Suspense>
                </PrivateRoute>
              } 
            />
          
            {/* Professor Routes */}
            <Route 
              path="/materiile-mele-profesor" 
              element={
                <PrivateRoute>
                  <Suspense fallback={<PageLoadingFallback pageName="My Courses" />}>
                    <ProfesorMateriileMelePageWithProvider />
                  </Suspense>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/profesor/materiile-mele" 
              element={
                <PrivateRoute>
                  <Suspense fallback={<PageLoadingFallback pageName="Professor Dashboard" />}>
                    <ProfesorMateriileMelePageWithProvider />
                  </Suspense>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/profesor/materie/:materieId" 
              element={
                <PrivateRoute>
                  <Suspense fallback={<PageLoadingFallback pageName="Course Details" />}>
                    <ProfesorMaterieDetailsPageWithProvider />
                  </Suspense>
                </PrivateRoute>
              } 
            />
          
            {/* Admin Routes - Now also accessible by Secretaries for specific functions */}
            <Route 
              path="/admin-utilizatori" 
              element={
                <AdminRoute allowSecretar={true}>
                  <Suspense fallback={<PageLoadingFallback pageName="User Management" />}>
                    <AdminPageWithProvider />
                  </Suspense>
                </AdminRoute>
              } 
            />
            
            <Route 
              path="/admin-materii" 
              element={
                <AdminRoute allowSecretar={true}>
                  <Suspense fallback={<PageLoadingFallback pageName="Course Management" />}>
                    <AdminMateriiPageWithProvider />
                  </Suspense>
                </AdminRoute>
              } 
            />
            
            <Route 
              path="/istoric-academic" 
              element={
                <AdminRoute allowSecretar={true}>
                  <Suspense fallback={<PageLoadingFallback pageName="Academic History" />}>
                    <AdminIstoricAcademicPageWithProvider />
                  </Suspense>
                </AdminRoute>
              } 
            />
            
            <Route 
              path="/alocare-automata" 
              element={
                <AdminRoute allowSecretar={true}>
                  <Suspense fallback={<PageLoadingFallback pageName="Automatic Allocation" />}>
                    <AlocareAutomataPage />
                  </Suspense>
                </AdminRoute>
              } 
            />
            
            <Route 
              path="/inscriere-anul-urmator" 
              element={
                <AdminRoute allowSecretar={true}>
                  <Suspense fallback={<PageLoadingFallback pageName="Next Year Registration" />}>
                    <StudentNextYearRegistrationPage />
                  </Suspense>
                </AdminRoute>
              } 
            />
            
            <Route
              path="/registration-settings"
              element={
                <AdminRoute allowSecretar={true}>
                  <Suspense fallback={<PageLoadingFallback pageName="Registration Settings" />}>
                    <RegistrationSettingsPage />
                  </Suspense>
                </AdminRoute>
              }
            />
          
            {/* Secretar Routes */}
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;