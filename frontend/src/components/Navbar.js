<<<<<<< HEAD
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
=======
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { isAdmin, isProfesor, isStudent, isSecretar } from '../utils/userRoles';
>>>>>>> 797394fe (Adaugat Pachete, quality of life stuff)

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
<<<<<<< HEAD
  
  // Funcții de verificare a rolurilor bazate pe email
  const isAdmin = user?.email?.endsWith('@admin.com');
  // Verificăm exact formatul pentru profesori
  const isProfesor = user?.email?.match(/^[a-z]+\.[a-z]+@e-uvt\.ro$/);
=======
  const [userType, setUserType] = useState(null);
  const [roles, setRoles] = useState({
    isAdmin: false,
    isProfesor: false,
    isStudent: false,
    isSecretar: false
  });
  
  useEffect(() => {
    const fetchUserType = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserType(userDoc.data().tip);
          }
        } catch (error) {
          console.error('Eroare la încărcarea datelor utilizatorului:', error);
        }
      }
    };

    fetchUserType();
  }, [user]);

  useEffect(() => {
    const checkRoles = async () => {
      if (user) {
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
      }
    };

    checkRoles();
  }, [user]);
>>>>>>> 797394fe (Adaugat Pachete, quality of life stuff)

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navItems = [
<<<<<<< HEAD
    { path: '/home', label: 'Home' },
    { path: '/profile', label: 'Profil' },
    ...(isProfesor ? [{ path: '/materiile-mele', label: 'Materiile Mele' }] : []),
    ...(isAdmin ? [
      { path: '/admin-utilizatori', label: 'Utilizatori' },
      { path: '/admin-materii', label: 'Administrare Materii' }
    ] : []),
=======
    ...(roles.isAdmin ? [] : [{ path: '/home', label: 'Home' }]),
    ...(roles.isAdmin ? [] : [{ path: '/profile', label: 'Profil' }]),
    ...(roles.isProfesor ? [{ path: '/materiile-mele', label: 'Materiile Mele' }] : []),
    ...(roles.isAdmin ? [
      { path: '/admin-utilizatori', label: 'Utilizatori' },
      { path: '/admin-materii', label: 'Materii' }
    ] : []),
    ...(roles.isStudent ? [
      { path: '/inscriere-materii', label: 'Înscriere Materii' },
      { path: '/materiile-studentului', label: 'Materiile Mele' }
    ] : [])
>>>>>>> 797394fe (Adaugat Pachete, quality of life stuff)
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

<<<<<<< HEAD
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
=======
      <div className="flex items-center space-x-4">
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded transition-colors"
        >
          Deconectare
        </button>
>>>>>>> 797394fe (Adaugat Pachete, quality of life stuff)
      </div>
    </div>
  );
};

export default Navbar;