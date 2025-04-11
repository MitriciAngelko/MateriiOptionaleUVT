import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { isAdmin, isProfesor, isStudent, isSecretar } from '../utils/userRoles';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const [roles, setRoles] = useState({
    isAdmin: false,
    isProfesor: false,
    isStudent: false,
    isSecretar: false
  });
  
  useEffect(() => {
    const checkRoles = async () => {
      if (user?.uid) {
        try {
          const admin = isAdmin(user);
          const [profesor, student, secretar] = await Promise.all([
            isProfesor(user.uid),
            isStudent(user.uid),
            isSecretar(user.uid)
          ]);

          setRoles({
            isAdmin: admin,
            isProfesor: profesor,
            isStudent: student,
            isSecretar: secretar
          });
        } catch (error) {
          console.error('Eroare la verificarea rolurilor:', error);
        }
      }
    };

    checkRoles();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Eroare la deconectare:', error);
    }
  };

  // Generăm elementele de navigare bazate pe roluri
  const getNavItems = () => {
    const items = [];
    
    // Elemente comune
    items.push({ path: '/home', label: 'Home' });
    items.push({ path: '/profile', label: 'Profil' });
    
    // Elemente specifice rolurilor
    if (roles.isProfesor) {
      items.push({ path: '/materiile-mele', label: 'Materiile Mele' });
    }
    
    if (roles.isAdmin) {
      items.push({ path: '/admin-utilizatori', label: 'Utilizatori' });
      items.push({ path: '/admin-materii', label: 'Materii' });
      items.push({ path: '/istoric-academic', label: 'Istoric Academic' });
    }
    
    if (roles.isStudent) {
      items.push({ path: '/inscriere-materii', label: 'Înscriere Materii' });
      items.push({ path: '/materiile-studentului', label: 'Materiile Mele' });
    }
    
    return items;
  };

  const navItems = getNavItems();

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