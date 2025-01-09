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
    <div className="h-16 bg-[#034a76] text-white w-full flex items-center justify-between px-6 fixed top-0 z-50">
      <div className="flex items-center">
        <div className="mr-8 pt-1">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-12 w-auto"
          />
        </div>
        
        <nav className="flex">
          <ul className="flex space-x-4">
            {navItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`px-4 py-2 rounded hover:bg-[#023557] transition-colors
                    ${location.pathname === item.path ? 'bg-[#023557]' : ''}`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="flex items-center">
        {user ? (
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-300">{user.email}</div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              Deconectare
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Autentificare
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;