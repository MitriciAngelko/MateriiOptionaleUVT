import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import AdminRoute from './components/AdminRoute';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="fixed inset-y-0 left-0 w-64">
        <Navbar />
      </div>

      <div className="ml-64 flex-1 p-8">
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
          
          {/* Rută protejată pentru admin dashboard */}
          <Route
            path="/admindb"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;