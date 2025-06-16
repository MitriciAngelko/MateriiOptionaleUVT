import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { isAdmin, isProfesor, isStudent, isSecretar, hasAdminAccess } from '../utils/userRoles';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [roles, setRoles] = useState({
    isAdmin: false,
    isProfesor: false,
    isStudent: false,
    isSecretar: false,
    hasAdminAccess: false
  });

  // Special case for admin@admin.com
  const isMainAdmin = user?.email === 'admin@admin.com';
  
  useEffect(() => {
    const checkRoles = async () => {
      if (user?.uid) {
        try {
          console.log('🔍 Navbar: Checking roles for user:', user.email);
          
          // Use Promise.all for better performance
          const [admin, profesor, student, secretar, adminAccess] = await Promise.all([
            isAdmin(user),
            isProfesor(user),
            isStudent(user),
            isSecretar(user),
            hasAdminAccess(user)
          ]);

          const roleResults = {
            isAdmin: admin,
            isProfesor: profesor,
            isStudent: student,
            isSecretar: secretar,
            hasAdminAccess: adminAccess
          };

          console.log('📊 Navbar: Role check results:', roleResults);
          setRoles(roleResults);

          // Obține datele utilizatorului pentru inițiale
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error('💥 Navbar: Error checking roles:', error);
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

  // Generăm elementele de navigare bazate pe roluri - SIMPLIFIED
  const getNavItems = () => {
    const items = [];
    
    // For users with admin access (both admin and secretar)
    if (isMainAdmin || roles.hasAdminAccess) {
      items.push({ path: '/admin-utilizatori', label: 'Utilizatori' });
      items.push({ path: '/admin-materii', label: 'Materii' });
      
      // Include "Istoric Academic" for both admin users and secretaries
      if (isMainAdmin || roles.isAdmin || roles.isSecretar) {
        items.push({ path: '/istoric-academic', label: 'Istoric Academic' });
      }
      
      items.push({ path: '/alocare-automata', label: 'Alocare Automată' });
      items.push({ path: '/inscriere-anul-urmator', label: 'Înscrierea în Anul Următor' });
      
      console.log('📋 Navbar: Admin navigation items added for:', user?.email);
      return items;
    }
    
    // For professors
    if (roles.isProfesor) {
      items.push({ path: '/profesor/materiile-mele', label: 'Materiile Mele' });
    }
    
    // For students
    if (roles.isStudent) {
      items.push({ path: '/materiile-mele', label: 'Materiile Mele' });
      items.push({ path: '/inscriere-materii', label: 'Înscriere Materii' });
    }
    
    console.log('📋 Navbar: Navigation items:', items.map(i => i.label).join(', '));
    return items;
  };

  const navItems = getNavItems();

  // Obține inițialele utilizatorului
  const getInitials = () => {
    if (!userData?.prenume || !userData?.nume) return '?';
    return `${userData.prenume.charAt(0)}${userData.nume.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      {/* Floating Burger Button - Mobile Only */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-full bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:bg-gradient-to-r dark:from-yellow-accent dark:to-yellow-accent/70 text-white dark:text-blue-dark shadow-lg hover:shadow-xl transition-all duration-300 group backdrop-blur-sm border border-white/20 dark:border-blue-light/30"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <span className={`block h-0.5 w-6 bg-current transform transition-all duration-300 ${
            isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
          }`}></span>
          <span className={`block h-0.5 w-6 bg-current transform transition-all duration-300 mt-1 ${
            isMobileMenuOpen ? 'opacity-0' : ''
          }`}></span>
          <span className={`block h-0.5 w-6 bg-current transform transition-all duration-300 mt-1 ${
            isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
          }`}></span>
        </div>
      </button>

      {/* Desktop Navbar Only */}
      <div className="hidden lg:block h-16 bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:bg-gradient-to-r dark:from-yellow-accent dark:to-yellow-accent/70 text-white dark:text-blue-dark w-full fixed top-0 z-50 shadow-lg border-b border-[#3471B8]/30 dark:border-blue-light/40 transition-all duration-300">
        <div className="flex items-center justify-between px-6 h-full">
          {/* Left Section - Logo & Navigation */}
          <div className="flex items-center h-full">
            {/* Logo */}
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
            
            {/* Desktop Navigation */}
            <nav className="flex h-full ml-4">
              <ul className="flex h-full">
                {navItems.map((item) => (
                  <li key={item.path} className="h-full">
                    <button
                      onClick={() => navigate(item.path)}
                      className={`px-4 h-full flex items-center relative group transition-all duration-300 font-medium
                        ${location.pathname === item.path 
                          ? 'border-b-4 border-[#E3AB23] dark:border-blue-light bg-white/5 dark:bg-blue-dark/5' 
                          : 'hover:bg-white/10 dark:hover:bg-blue-dark/10 hover:backdrop-blur-sm'
                        }`}
                    >
                      <span className="drop-shadow-sm whitespace-nowrap">{item.label}</span>
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

          {/* Right Section - Desktop User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <ThemeToggle />
                {/* Profile Button - Show for secretar and other non-admin users */}
                {!isMainAdmin && (
                                  <button
                  onClick={handleProfileClick}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-gray-100 dark:from-blue-dark dark:to-blue-light text-[#024A76] dark:text-yellow-accent flex items-center justify-center font-bold text-lg hover:from-[#E3AB23] hover:to-[#E3AB23]/80 dark:hover:from-yellow-accent dark:hover:to-yellow-accent/80 hover:text-[#024A76] dark:hover:text-blue-dark transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border-2 border-white/20 dark:border-blue-light/30"
                    title="Profil"
                  >
                    {getInitials()}
                  </button>
                )}
                
                {/* Logout Button */}
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
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Mobile Sidebar Menu */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-gradient-to-b from-[#024A76] via-[#024A76] to-[#3471B8] dark:bg-gradient-to-b dark:from-yellow-accent dark:via-yellow-accent/85 dark:to-yellow-accent/70 text-white dark:text-blue-dark z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Mobile Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 dark:border-blue-dark/20">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-8 w-auto drop-shadow-md object-contain"
            />
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-xl hover:bg-white/10 dark:hover:bg-blue-dark/10 transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-4">
            {navItems.map((item, index) => (
              <li key={item.path}>
                <button
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl relative group transition-all duration-300 font-medium flex items-center space-x-3
                    ${location.pathname === item.path 
                      ? 'bg-white/20 dark:bg-blue-dark/20 border-l-4 border-[#E3AB23] dark:border-blue-light shadow-lg' 
                      : 'hover:bg-white/10 dark:hover:bg-blue-dark/10 hover:translate-x-1'
                    }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="drop-shadow-sm">{item.label}</span>
                  {location.pathname === item.path && (
                    <div className="absolute right-4">
                      <div className="w-2 h-2 bg-[#E3AB23] dark:bg-blue-light rounded-full animate-pulse"></div>
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile User Section */}
        <div className="border-t border-white/10 dark:border-blue-dark/20 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-gray-100 dark:from-blue-dark dark:to-blue-light text-[#024A76] dark:text-yellow-accent flex items-center justify-center font-bold text-lg shadow-lg border-2 border-white/20 dark:border-blue-light/30">
              {getInitials()}
            </div>
            <div className="flex-1">
              <p className="font-medium drop-shadow-sm">
                {userData?.prenume} {userData?.nume}
              </p>
              <p className="text-xs text-white/70 dark:text-blue-dark/70 drop-shadow-sm">
                {user?.email}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <ThemeToggle />
            
            {/* Profile Button - Mobile */}
            {!isMainAdmin && (
              <button
                onClick={() => {
                  handleProfileClick();
                  setIsMobileMenuOpen(false);
                }}
                className="flex-1 px-3 py-2 text-sm bg-white/10 dark:bg-blue-dark/10 hover:bg-white/20 dark:hover:bg-blue-dark/20 rounded-lg transition-all duration-300 font-medium flex items-center justify-center space-x-2 backdrop-blur-sm border border-white/20 dark:border-blue-light/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profil</span>
              </button>
            )}
            
            {/* Logout Button - Mobile */}
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="flex-1 px-3 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all duration-300 font-medium flex items-center justify-center space-x-2 backdrop-blur-sm border border-red-500/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Ieșire</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;