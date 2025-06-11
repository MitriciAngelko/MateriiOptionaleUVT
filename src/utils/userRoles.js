import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Verifică dacă utilizatorul este admin după email sau tip
export const isAdmin = async (userOrUserId) => {
  // Special case for admin@admin.com - always returns true
  if (typeof userOrUserId === 'object' && userOrUserId?.email === 'admin@admin.com') {
    return true;
  }
  
  // Dacă primim direct obiectul user, verificăm după email
  if (typeof userOrUserId === 'object') {
    return userOrUserId?.email?.endsWith('@admin.com') || false;
  }
  
  // Dacă primim un userId (string), verificăm în baza de date
  if (typeof userOrUserId === 'string') {
    try {
      const userDoc = await getDoc(doc(db, 'users', userOrUserId));
      if (!userDoc.exists()) return false;
      
      const userData = userDoc.data();
      
      // Special case for admin@admin.com
      if (userData.email === 'admin@admin.com') {
        return true;
      }
      
      // Verificăm dacă utilizatorul are emailul care se termină cu @admin.com sau tipul 'admin'
      return (userData.email?.endsWith('@admin.com') || userData.tip === 'admin');
    } catch (error) {
      console.error('Eroare la verificarea rolului de admin:', error);
      return false;
    }
  }
  
  return false;
};

// Verifică dacă utilizatorul este profesor după rolul din baza de date
export const isProfesor = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() && userDoc.data().tip === 'profesor';
  } catch (error) {
    console.error('Eroare la verificarea rolului de profesor:', error);
    return false;
  }
};

// Verifică dacă utilizatorul este student după rolul din baza de date
export const isStudent = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() && userDoc.data().tip === 'student';
  } catch (error) {
    console.error('Eroare la verificarea rolului de student:', error);
    return false;
  }
};

// Verifică dacă utilizatorul este secretar după rolul din baza de date
export const isSecretar = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() && userDoc.data().tip === 'secretar';
  } catch (error) {
    console.error('Eroare la verificarea rolului de secretar:', error);
    return false;
  }
}; 