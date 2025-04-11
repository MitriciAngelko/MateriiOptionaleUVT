import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Verifică dacă utilizatorul este admin după email
export const isAdmin = (user) => {
  return user?.email?.endsWith('@admin.com') || false;
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