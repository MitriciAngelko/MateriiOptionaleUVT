import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          
          // Obține datele utilizatorului din Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userRole = userDoc.exists() ? userDoc.data().role : 'user';
          
          const userData = {
            uid: user.uid,
            email: user.email,
            token: token,
            role: userRole
          };

          dispatch(setUser(userData));
          localStorage.setItem('user', JSON.stringify(userData));

          // Modificăm logica de redirecționare
          if (location.pathname === '/login' || location.pathname === '/register') {
            if (userRole === 'admin') {
              navigate('/admin');
            } else {
              navigate('/');
            }
          }
        } catch (error) {
          console.error('Error setting up user:', error);
          dispatch(logout());
          localStorage.removeItem('user');
          navigate('/login');
        }
      } else {
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
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
