<<<<<<< HEAD
import React from 'react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Conținutul a fost eliminat, lăsând doar containerul pentru layout */}
=======
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

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const isAdminUser = isAdmin(user);
            
            // Redirecționează admin-ul direct la pagina de utilizatori
            if (isAdminUser) {
              navigate('/admin-utilizatori');
              return;
            }

            setUserRoles({
              isAdmin: isAdminUser,
              isStudent: userData.tip === 'student',
              isProfesor: userData.tip === 'profesor',
              isSecretar: userData.tip === 'secretar'
            });
          }
        } catch (error) {
          console.error('Eroare la încărcarea rolului utilizatorului:', error);
        }
      }
    };

    fetchUserRole();
  }, [user, navigate]);

  // Dacă este admin, nu mai renderăm nimic
  if (userRoles.isAdmin) {
    return null;
  }

  const menuItems = [
    ...(userRoles.isStudent ? [
      {
        title: 'Înscriere Materii',
        description: 'Înscrie-te la materiile opționale disponibile',
        path: '/inscriere-materii',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        )
      },
      {
        title: 'Materiile Mele',
        description: 'Vezi materiile la care ești înscris',
        path: '/materiile-studentului',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
      }
    ] : []),
    ...(userRoles.isProfesor ? [
      {
        title: 'Materiile Mele',
        description: 'Gestionează materiile pe care le predai',
        path: '/materiile-mele',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
          </svg>
        )
      }
    ] : []),
    {
      title: 'Profil',
      description: 'Vizualizează și editează profilul tău',
      path: '/profile',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Bine ai venit{user?.nume ? `, ${user.nume}` : ''}!
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col items-center text-center group"
            >
              <div className="text-[#034a76] group-hover:text-[#023557] mb-4">
                {item.icon}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h2>
              <p className="text-gray-600">{item.description}</p>
            </button>
          ))}
        </div>
      </div>
>>>>>>> 797394fe (Adaugat Pachete, quality of life stuff)
    </div>
  );
};

export default HomePage;