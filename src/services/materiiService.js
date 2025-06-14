import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Fetches all available materii from Firestore
 * @returns {Promise<Array>} - Array of materii
 */
export const fetchAllMaterii = async () => {
  try {
    const materiiSnapshot = await getDocs(collection(db, 'materii'));
    const materiiList = [];
    
    materiiSnapshot.forEach(doc => {
      materiiList.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return materiiList;
  } catch (error) {
    console.error('Error fetching materii:', error);
    throw error;
  }
};

/**
 * Fetches materii for a specific professor
 * @param {string} profesorId - Professor ID
 * @returns {Promise<Array>} - Array of professor's materii
 */
export const fetchMateriiProfesor = async (profesorId) => {
  try {
    const materiiQuery = query(
      collection(db, 'materii'),
      where('profesorId', '==', profesorId)
    );
    
    const materiiSnapshot = await getDocs(materiiQuery);
    const materiiList = [];
    
    materiiSnapshot.forEach(doc => {
      materiiList.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return materiiList;
  } catch (error) {
    console.error('Error fetching professor materii:', error);
    throw error;
  }
};

/**
 * Fetches materii filtered by criteria
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Array>} - Filtered materii array
 */
export const fetchMateriiFiltered = async (filters = {}) => {
  try {
    let materiiQuery = collection(db, 'materii');
    const constraints = [];

    // Add filters
    if (filters.facultate) {
      constraints.push(where('facultate', '==', filters.facultate));
    }
    if (filters.specializare) {
      constraints.push(where('specializare', '==', filters.specializare));
    }
    if (filters.an) {
      constraints.push(where('an', '==', filters.an));
    }
    if (filters.tip) {
      constraints.push(where('tip', '==', filters.tip));
    }

    // Add ordering
    constraints.push(orderBy('nume'));

    if (constraints.length > 0) {
      materiiQuery = query(materiiQuery, ...constraints);
    }

    const materiiSnapshot = await getDocs(materiiQuery);
    const materiiList = [];
    
    materiiSnapshot.forEach(doc => {
      materiiList.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Apply text search filter if provided
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return materiiList.filter(materie => 
        materie.nume.toLowerCase().includes(searchTerm) ||
        materie.descriere?.toLowerCase().includes(searchTerm)
      );
    }
    
    return materiiList;
  } catch (error) {
    console.error('Error fetching filtered materii:', error);
    throw error;
  }
};

/**
 * Fetches mandatory courses for a specific student profile
 * @param {Object} studentProfile - Student profile data
 * @returns {Promise<Array>} - Array of mandatory materii
 */
export const fetchMandatoryMaterii = async (studentProfile) => {
  try {
    const materiiQuery = query(
      collection(db, 'materii'),
      where('tip', '==', 'obligatorie'),
      where('facultate', '==', studentProfile.facultate),
      where('specializare', '==', studentProfile.specializare),
      where('an', '==', studentProfile.an)
    );

    const materiiSnapshot = await getDocs(materiiQuery);
    const materiiList = [];
    
    materiiSnapshot.forEach(doc => {
      materiiList.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return materiiList;
  } catch (error) {
    console.error('Error fetching mandatory materii:', error);
    throw error;
  }
};

/**
 * Fetches optional courses for a specific student profile
 * @param {Object} studentProfile - Student profile data
 * @returns {Promise<Array>} - Array of optional materii
 */
export const fetchOptionalMaterii = async (studentProfile) => {
  try {
    const materiiQuery = query(
      collection(db, 'materii'),
      where('tip', '==', 'optionala'),
      where('facultate', '==', studentProfile.facultate),
      where('specializare', '==', studentProfile.specializare),
      where('an', '==', studentProfile.an)
    );

    const materiiSnapshot = await getDocs(materiiQuery);
    const materiiList = [];
    
    materiiSnapshot.forEach(doc => {
      materiiList.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return materiiList;
  } catch (error) {
    console.error('Error fetching optional materii:', error);
    throw error;
  }
}; 