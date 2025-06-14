import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setUser, logout } from '../redux/userSlice';
import { useNavigate, useLocation } from 'react-router-dom';

// Initialize Firebase services
import { auth, db } from '../firebase';

export const AuthContext = createContext();

// Definim rutele publice care nu necesită autentificare
const PUBLIC_ROUTES = ['/login', '/register'];

const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  // Function to create missing user document in Firestore
  const createMissingUserDocument = async (user) => {
    try {
      console.log('🔧 AuthProvider: Creating missing user document for:', user.email);
      
      // Determine user type based on email
      let userType = 'student'; // default
      if (user.email === 'admin@admin.com' || user.email?.endsWith('@admin.com')) {
        userType = 'admin';
      } else if (user.email?.includes('profesor') || user.email?.includes('teacher')) {
        userType = 'profesor';
      } else if (user.email?.includes('secretar') || user.email?.includes('secretary')) {
        userType = 'secretar';
      }
      
      const userData = {
        email: user.email,
        uid: user.uid,
        tip: userType,
        role: userType,
        createdAt: new Date(),
        autoCreated: true,
        nume: user.displayName?.split(' ')[1] || 'Unknown',
        prenume: user.displayName?.split(' ')[0] || 'User',
        facultate: userType === 'student' ? 'Matematică și Informatică' : null,
        specializare: userType === 'student' ? 'Informatică' : null,
        an: userType === 'student' ? 'I' : null
      };

      await setDoc(doc(db, 'users', user.uid), userData);
      console.log('✅ AuthProvider: Successfully created user document');
      
      return userData;
    } catch (error) {
      console.error('💥 AuthProvider: Failed to create user document:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          
          // Obține datele utilizatorului din Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          let userRole = 'user';
          let userTip = null;
          let userData = null;
          
          if (userDoc.exists()) {
            userData = userDoc.data();
            // Store both role and tip for maximum compatibility
            userRole = userData.role || userData.tip || 'user';
            userTip = userData.tip || userData.role || null;
          } else {
            // User exists in Firebase Auth but not in Firestore - create document
            console.warn('⚠️ AuthProvider: User missing from Firestore, creating document...');
            userData = await createMissingUserDocument(user);
            
            if (userData) {
              userRole = userData.role || userData.tip || 'user';
              userTip = userData.tip || userData.role || null;
            } else {
              // If creation failed, use safe defaults
              userRole = 'user';
              userTip = 'student';
            }
          }
          
          // Create comprehensive user data object
          const userDataForRedux = {
            uid: user.uid,
            email: user.email,
            token: token,
            role: userRole,  // For AuthProvider compatibility
            tip: userTip     // For userRoles.js compatibility
          };

          console.log('🔐 AuthProvider: User authenticated', {
            email: user.email,
            uid: user.uid,
            role: userRole,
            tip: userTip,
            hadFirestoreDoc: userDoc.exists()
          });

          dispatch(setUser(userDataForRedux));
          localStorage.setItem('user', JSON.stringify(userDataForRedux));

          // Modificăm logica de redirecționare - toți utilizatorii merg la homepage după login
          if (location.pathname === '/login' || location.pathname === '/register') {
            console.log('🚀 AuthProvider: Redirecting user to homepage after successful login');
            navigate('/home');
          }
        } catch (error) {
          console.error('💥 AuthProvider: Error setting up user:', error);
          dispatch(logout());
          localStorage.removeItem('user');
          navigate('/login');
        }
      } else {
        console.log('🚪 AuthProvider: User logged out');
        dispatch(logout());
        localStorage.removeItem('user');
        if (!PUBLIC_ROUTES.includes(location.pathname)) {
          navigate('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dispatch, navigate, location]);

  // Token refresh periodic
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken(true);
          const userData = JSON.parse(localStorage.getItem('user'));
          if (userData) {
            const updatedUserData = {
              ...userData,
              token: token
            };
            localStorage.setItem('user', JSON.stringify(updatedUserData));
            dispatch(setUser(updatedUserData));
          }
        } catch (error) {
          console.error('Error refreshing token:', error);
        }
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-dark-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#024A76] dark:border-blue-light mx-auto mb-4"></div>
          <p className="text-[#024A76] dark:text-blue-light font-medium">Se încarcă aplicația...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
