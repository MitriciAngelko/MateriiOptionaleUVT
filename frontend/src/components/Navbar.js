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
  const [userData, setUserData] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

          // Obține datele utilizatorului pentru inițiale
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
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

  const handleProfileClick = () => {
    navigate('/profile');
  };

  // Generăm elementele de navigare bazate pe roluri
  const getNavItems = () => {
    const items = [];
    
    // Elemente comune
    items.push({ path: '/home', label: 'Home' });
    
    // Elemente specifice rolurilor
    if (roles.isProfesor) {
      items.push({ path: '/materiile-mele', label: 'Materiile Mele' });
    }
    
    if (roles.isAdmin) {
      items.push({ path: '/admin-utilizatori', label: 'Utilizatori' });
      items.push({ path: '/admin-materii', label: 'Materii' });
      items.push({ path: '/istoric-academic', label: 'Istoric Academic' });
      items.push({ path: '/alocare-automata', label: 'Alocare Automată' });
    }
    
    if (roles.isStudent) {
      items.push({ path: '/inscriere-materii', label: 'Înscriere Materii' });
      items.push({ path: '/materiile-studentului', label: 'Materiile Mele' });
    }
    
    return items;
  };

  const navItems = getNavItems();

  // Obține inițialele utilizatorului
  const getInitials = () => {
    if (!userData?.prenume || !userData?.nume) return '?';
    return `${userData.prenume.charAt(0)}${userData.nume.charAt(0)}`.toUpperCase();
  };

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
        
        {/* Buton hamburger pentru mobile */}
        <button 
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
        
        {/* Meniu de navigare pentru desktop */}
        <nav className="hidden md:flex">
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
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <button
              onClick={handleProfileClick}
              className="w-10 h-10 rounded-full bg-white text-[#034a76] flex items-center justify-center font-bold text-lg hover:bg-gray-100 transition-colors"
              title="Profil"
            >
              {getInitials()}
            </button>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
              title="Deconectare"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Autentificare
          </button>
        )}
      </div>
      
      {/* Meniu mobile dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-[#034a76] border-t border-[#023557] z-50">
          <ul className="py-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-3 hover:bg-[#023557] transition-colors
                    ${location.pathname === item.path ? 'bg-[#023557]' : ''}`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Navbar;