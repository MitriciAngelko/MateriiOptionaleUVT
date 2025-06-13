import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { isAdmin, isProfesor, isStudent, isSecretar } from '../utils/userRoles';
import ThemeToggle from './ThemeToggle';

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
  
  // Special check for main admin
  const isMainAdmin = user?.email === 'admin@admin.com';
  
  useEffect(() => {
    const checkRoles = async () => {
      if (user?.uid) {
        try {
          // Special case for admin@admin.com
          const admin = isMainAdmin || await isAdmin(user);
          
          // Utilizăm await pentru toate verificările de rol deoarece acum toate sunt async
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
  }, [user, isMainAdmin]);

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
    
    // Removed Home link as logo will now serve this purpose
    
    // Elemente specifice rolurilor
    if (roles.isProfesor) {
      items.push({ path: '/profesor/materiile-mele', label: 'Materiile Mele' });
    }
    
    // Special case for admin@admin.com or other admins
    if (isMainAdmin || roles.isAdmin) {
      items.push({ path: '/admin-utilizatori', label: 'Utilizatori' });
      items.push({ path: '/admin-materii', label: 'Materii' });
      items.push({ path: '/istoric-academic', label: 'Istoric Academic' });
      items.push({ path: '/alocare-automata', label: 'Alocare Automată' });
      items.push({ path: '/inscriere-anul-urmator', label: 'Înscrierea în Anul Următor' });
    }
    
    // Elemente pentru secretari
    if (roles.isSecretar && !isMainAdmin && !roles.isAdmin) {
      items.push({ path: '/secretar/alocare-automata', label: 'Alocare Automată' });
      items.push({ path: '/secretar/inscriere-anul-urmator', label: 'Înscrierea în Anul Următor' });
    }
    
    // Elemente pentru studenți (când nu sunt admin)
    if (roles.isStudent && !isMainAdmin && !roles.isAdmin) {
      items.push({ path: '/materiile-mele', label: 'Materiile Mele' });
      items.push({ path: '/inscriere-materii', label: 'Înscriere Materii' });
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
    <div className="h-16 bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:bg-gradient-to-r dark:from-yellow-accent dark:to-yellow-accent/90 text-white dark:text-blue-dark w-full flex items-center justify-between px-6 fixed top-0 z-50 shadow-lg border-b border-[#3471B8]/30 dark:border-blue-light/40 transition-colors duration-300">
      <div className="flex items-center h-full">
        <div className="mr-8 flex items-center h-full">
          <button
            onClick={() => navigate('/home')}
            className="cursor-pointer hover:scale-105 transition-all duration-300 p-1 rounded-lg hover:bg-white/10 dark:hover:bg-blue-dark/10 backdrop-blur-sm flex items-center justify-center"
            aria-label="Home"
          >
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-10 w-auto drop-shadow-md object-contain"
            />
          </button>
        </div>
        
        {/* Buton hamburger pentru mobile */}
        <button 
          className="md:hidden p-2 rounded-lg hover:bg-white/10 dark:hover:bg-blue-dark/10 backdrop-blur-sm transition-all duration-300"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-6 h-6 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
        
        {/* Meniu de navigare pentru desktop */}
        <nav className="hidden md:flex h-full">
          <ul className="flex h-full">
            {navItems.map((item) => (
              <li key={item.path} className="h-full">
                <button
                  onClick={() => navigate(item.path)}
                  className={`px-4 h-full flex items-center relative group transition-all duration-300 font-medium
                    ${location.pathname === item.path 
                      ? 'border-b-4 border-[#E3AB23] dark:border-blue-light' 
                      : 'hover:bg-white/10 dark:hover:bg-blue-dark/10 hover:backdrop-blur-sm'
                    }`}
                >
                  <span className="drop-shadow-sm">{item.label}</span>
                  {/* Hover line - only show if not current page */}
                  {location.pathname !== item.path && (
                    <span className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/70 dark:from-blue-light dark:to-blue-dark group-hover:w-full transition-all duration-300 shadow-md"></span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <ThemeToggle />
            <button
              onClick={handleProfileClick}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-gray-100 dark:from-blue-dark dark:to-blue-light text-[#024A76] dark:text-yellow-accent flex items-center justify-center font-bold text-lg hover:from-[#E3AB23] hover:to-[#E3AB23]/80 dark:hover:from-yellow-accent dark:hover:to-yellow-accent/80 hover:text-[#024A76] dark:hover:text-blue-dark transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border-2 border-white/20 dark:border-blue-light/30"
              title="Profil"
            >
              {getInitials()}
            </button>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border-2 border-white/20 dark:border-blue-light/30"
              title="Deconectare"
            >
              <svg className="w-5 h-5 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 dark:from-blue-light dark:to-blue-dark text-[#024A76] dark:text-white hover:from-[#E3AB23]/90 hover:to-[#E3AB23]/70 dark:hover:from-blue-dark dark:hover:to-blue-light rounded-lg transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 border border-white/20 dark:border-blue-light/30"
          >
            Autentificare
          </button>
        )}
      </div>
      
      {/* Meniu mobile dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-gradient-to-b from-[#024A76] to-[#3471B8] dark:bg-gradient-to-b dark:from-yellow-accent dark:to-yellow-accent/90 border-t border-[#E3AB23]/30 dark:border-blue-light/40 z-50 shadow-xl backdrop-blur-sm transition-colors duration-300">
          <ul className="py-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-3 relative group transition-all duration-300 font-medium text-white dark:text-blue-dark
                    ${location.pathname === item.path 
                      ? 'border-l-4 border-[#E3AB23] dark:border-blue-light' 
                      : 'hover:bg-white/10 dark:hover:bg-blue-dark/10 hover:backdrop-blur-sm'
                    }`}
                >
                  <span className="drop-shadow-sm">{item.label}</span>
                  {/* Hover line for mobile - only show if not current page */}
                  {location.pathname !== item.path && (
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/70 dark:from-blue-light dark:to-blue-dark group-hover:w-full transition-all duration-300 shadow-sm"></span>
                  )}
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