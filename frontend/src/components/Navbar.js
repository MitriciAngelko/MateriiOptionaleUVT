import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.email?.endsWith('@admin.com');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navItems = [
    { path: '/home', label: 'Home' },
    { path: '/profile', label: 'Profil' },
    ...(isAdmin ? [{ path: '/admindb', label: 'Admin Dashboard' }] : []),
  ];

  return (
    <div className="h-full bg-gray-800 text-white w-64 flex flex-col">
      <div className="p-4">
        <h1 className="text-xl font-bold">Aplicație</h1>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2 py-4">
          {navItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors
                  ${location.pathname === item.path ? 'bg-gray-700' : ''}`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        {user ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-300">{user.email}</div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              Deconectare
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="w-full px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Autentificare
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;