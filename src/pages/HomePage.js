import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isAdmin } from '../utils/userRoles';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const HomePage = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [userRoles, setUserRoles] = useState({
    isAdmin: false,
    isStudent: false,
    isProfesor: false,
    isSecretar: false
  });
  const [userData, setUserData] = useState(null);

  // Function to get dynamic greeting based on current time
  const getDynamicGreeting = (nume, prenume) => {
    const now = new Date();
    const hour = now.getHours();
    
    // Handle special case for admin@admin.com
    if (user?.email === 'admin@admin.com') {
      const greeting = hour >= 6 && hour < 12 ? 'Bună dimineața' : 
                     hour >= 12 && hour < 20 ? 'Bună ziua' : 'Bună seara';
      return `${greeting} Admin Principal!`;
    }
    
    // For other users, use actual name data or fallback to email-based name
    let displayName = '';
    if (nume || prenume) {
      displayName = `${prenume || ''} ${nume || ''}`.trim();
    } else if (userData?.prenume || userData?.nume) {
      displayName = `${userData.prenume || ''} ${userData.nume || ''}`.trim();
    } else if (user?.email) {
      // Extract a name from email as last resort
      const emailName = user.email.split('@')[0];
      displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    const greeting = hour >= 6 && hour < 12 ? 'Bună dimineața' : 
                    hour >= 12 && hour < 20 ? 'Bună ziua' : 'Bună seara';
    
    return `${greeting}${displayName ? ` ${displayName}` : ''}!`;
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserData(userData); // Store user data for greeting
            const isAdminUser = await isAdmin(user);

            setUserRoles({
              isAdmin: isAdminUser,
              isStudent: userData.tip === 'student',
              isProfesor: userData.tip === 'profesor',
              isSecretar: userData.tip === 'secretar'
            });
          } else {
            // Handle missing user document - create safe fallback
            console.warn('⚠️ HomePage: User document not found, using fallback data');
            
            let fallbackUserData;
            if (user.email === 'admin@admin.com') {
              fallbackUserData = { nume: 'Admin', prenume: 'Principal', tip: 'admin' };
            } else {
              // Extract name from email as fallback
              const emailName = user.email?.split('@')[0] || 'User';
              fallbackUserData = {
                nume: 'Unknown',
                prenume: emailName.charAt(0).toUpperCase() + emailName.slice(1),
                tip: 'student'
              };
            }
            
            setUserData(fallbackUserData);
            const isAdminUser = await isAdmin(user);
            
            setUserRoles({
              isAdmin: isAdminUser,
              isStudent: fallbackUserData.tip === 'student',
              isProfesor: fallbackUserData.tip === 'profesor',
              isSecretar: fallbackUserData.tip === 'secretar'
            });
          }
        } catch (error) {
          console.error('Eroare la încărcarea rolului utilizatorului:', error);
        }
      }
    };

    fetchUserRole();
  }, [user, navigate]);



  const menuItems = [
    ...(userRoles.isAdmin ? [
      {
        title: 'Gestionare Utilizatori',
        description: 'Administrează utilizatorii sistemului',
        path: '/admin-utilizatori',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        ),
        color: 'bg-[#034a76]'
      },
      {
        title: 'Gestionare Materii',
        description: 'Administrează materiile din sistem',
        path: '/admin-materii',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
        color: 'bg-[#e3ab23]'
      },
      {
        title: 'Istoric Academic',
        description: 'Vizualizează istoricul academic',
        path: '/istoric-academic',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        color: 'bg-[#034a76]'
      },
      {
        title: 'Alocare Automată',
        description: 'Configurează alocarea automată',
        path: '/alocare-automata',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        ),
        color: 'bg-[#e3ab23]'
      }
    ] : []),
    ...(userRoles.isStudent ? [
      {
        title: 'Materiile Mele',
        description: 'Vezi materiile tale și notele obținute',
        path: '/materiile-mele',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
        color: 'bg-[#034a76]'
      },
      {
        title: 'Înscriere Materii',
        description: 'Înscrie-te la materii optionale',
        path: '/inscriere-materii',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
        color: 'bg-[#e3ab23]'
      }
    ] : []),
    ...(userRoles.isProfesor ? [
      {
        title: 'Materiile Mele',
        description: 'Gestionează materiile pe care le predai',
        path: '/profesor/materiile-mele',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
          </svg>
        )
      }
    ] : []),
    ...(userRoles.isSecretar ? [
      {
        title: 'Gestionare Utilizatori',
        description: 'Administrează utilizatorii sistemului',
        path: '/admin-utilizatori',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        ),
        color: 'bg-[#034a76]'
      },
      {
        title: 'Gestionare Materii',
        description: 'Administrează materiile din sistem',
        path: '/admin-materii',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
        color: 'bg-[#e3ab23]'
      },
      {
        title: 'Istoric Academic',
        description: 'Vizualizează și gestionează istoricul academic al studenților',
        path: '/istoric-academic',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        color: 'bg-[#034a76]'
      },
      {
        title: 'Alocare Automată',
        description: 'Configurează alocarea automată',
        path: '/alocare-automata',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        ),
        color: 'bg-[#034a76]'
      },
      {
        title: 'Înscrierea în Anul Următor',
        description: 'Gestionează înscrierea studenților în anul următor',
        path: '/inscriere-anul-urmator',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
        color: 'bg-[#e3ab23]'
      }
    ] : []),
    // Show profile for secretar, profesor and student users (but not main admin)
    ...(user?.email !== 'admin@admin.com' ? [{
      title: 'Profil',
      description: 'Vizualizează și editează profilul tău',
      path: '/profile',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }] : [])
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent text-center mb-12 drop-shadow-sm">
          {getDynamicGreeting(userData?.nume, userData?.prenume)}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group border border-gray-200 dark:border-gray-700/50 hover:border-[#3471B8]/30 dark:hover:border-blue-light/50 hover:scale-105"
            >
              <div className="text-[#024A76] dark:text-blue-light group-hover:text-[#3471B8] dark:group-hover:text-yellow-accent mb-4 transition-all duration-300">
                {item.icon}
              </div>
              <h2 className="text-xl font-semibold text-[#024A76] dark:text-blue-light mb-2 group-hover:text-[#3471B8] dark:group-hover:text-yellow-accent transition-all duration-300">{item.title}</h2>
              <p className="text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200">{item.description}</p>
            </button>
          ))}
        </div>

        {/* UVT Contact Information */}
        <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-lg p-8 mt-10 border border-gray-200 dark:border-gray-700/50">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Contact Information */}
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-[#024A76] dark:text-blue-light drop-shadow-sm">Contact</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-[#024A76] dark:text-blue-light mr-3 mt-0.5">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 512 512">
                        <path d="M493.4 24.6l-104-24c-11.3-2.6-22.9 3.3-27.5 13.9l-48 112c-4.2 9.8-1.4 21.3 6.9 28l60.6 49.6c-36 76.7-98.9 140.5-177.2 177.2l-49.6-60.6c-6.8-8.3-18.2-11.1-28-6.9l-112 48C3.9 366.5-2 378.1.6 389.4l24 104C27.1 504.2 36.7 512 48 512c256.1 0 464-207.5 464-464 0-11.2-7.7-20.9-18.6-23.4z"></path>
                      </svg>
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">0256 592 155 | 0256 592 364</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#024A76] dark:text-blue-light mr-3 mt-0.5">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 512 512">
                        <path d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z"></path>
                      </svg>
                    </span>
                    <a href="mailto:secretariat.mateinfo@e-uvt.ro" className="text-gray-700 dark:text-gray-300 hover:text-[#024A76] transition-colors">secretariat.mateinfo@e-uvt.ro</a>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#024A76] dark:text-blue-light mr-3 mt-0.5">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 384 512">
                        <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"></path>
                      </svg>
                    </span>
                    <a 
                      href="https://maps.app.goo.gl/WTeWusmvYDhKRtgq5" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gray-700 dark:text-gray-300 hover:text-[#024A76] transition-colors"
                    >
                      Vasile Pârvan blvd. nr. 4 Timişoara Timiş România 300223
                    </a>
                  </li>
                </ul>
              </div>
              
              {/* Quick Links */}
              <div>
                <h3 className="text-lg font-semibold text-[#024A76] dark:text-blue-light mb-4 drop-shadow-sm">Link-uri rapide</h3>
                <div className="grid grid-cols-2 gap-3">
                  <a href="https://info.uvt.ro/" target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:text-[#024A76] transition-colors">
                    Facultatea de Informatică
                  </a>
                  <a href="https://info.uvt.ro/avizier-general/" target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:text-[#024A76] transition-colors">
                    Avizier General
                  </a>
                  <a href="https://info.uvt.ro/discipline-optionale/" target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:text-[#024A76] transition-colors">
                    Discipline Opționale
                  </a>
                  <a href="https://info.uvt.ro/orare/" target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:text-[#024A76] transition-colors">
                    Orare
                  </a>
                </div>
              </div>
            </div>
            
            {/* Social Media */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-[#024A76] mb-4 text-center drop-shadow-sm">Urmărește-ne</h3>
                              <div className="flex justify-center space-x-4">
                  <a href="https://www.facebook.com/fmi.uvt" target="_blank" rel="noopener noreferrer" className="text-[#024A76] hover:text-[#3471B8] transition-all duration-300 p-2 rounded-lg hover:bg-gray-50 hover:scale-110">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 320 512">
                    <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"></path>
                  </svg>
                </a>
                                  <a href="https://www.instagram.com/fmi_uvt/" target="_blank" rel="noopener noreferrer" className="text-[#024A76] hover:text-[#3471B8] transition-all duration-300 p-2 rounded-lg hover:bg-gray-50 hover:scale-110">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 448 512">
                      <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
                    </svg>
                  </a>
                  <a href="https://www.linkedin.com/school/west-university-of-timisoara/" target="_blank" rel="noopener noreferrer" className="text-[#024A76] hover:text-[#3471B8] transition-all duration-300 p-2 rounded-lg hover:bg-gray-50 hover:scale-110">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 448 512">
                      <path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"></path>
                    </svg>
                  </a>
                  <a href="https://www.youtube.com/channel/UC9rKWeN__ZbmqP3s-H6VcLA" target="_blank" rel="noopener noreferrer" className="text-[#024A76] hover:text-[#3471B8] transition-all duration-300 p-2 rounded-lg hover:bg-gray-50 hover:scale-110">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 576 512">
                      <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"></path>
                    </svg>
                  </a>
                  <a href="https://twitter.com/uvtromania" target="_blank" rel="noopener noreferrer" className="text-[#024A76] hover:text-[#3471B8] transition-all duration-300 p-2 rounded-lg hover:bg-gray-50 hover:scale-110">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 512 512">
                      <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path>
                    </svg>
                  </a>
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-500 mt-6">
              © {new Date().getFullYear()} Facultatea de Matematică și Informatică, Universitatea de Vest din Timișoara.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;