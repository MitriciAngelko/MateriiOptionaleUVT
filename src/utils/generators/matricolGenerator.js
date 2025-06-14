import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { SPECIALIZATION_PREFIXES } from '../../constants/academic';

/**
 * Generates the next matricol number for a given specialization
 * @param {string} specializare - The specialization code
 * @returns {Promise<string|null>} - The next matricol number or null if error
 */
export const getNextMatricolNumber = async (specializare) => {
  try {
    const prefix = SPECIALIZATION_PREFIXES[specializare];
    if (!prefix) return null;

    // Search for all students with the same prefix
    const q = query(
      collection(db, 'users'),
      where('specializare', '==', specializare)
    );
    const querySnapshot = await getDocs(q);
    
    // Find the highest existing matricol number
    let maxNumber = 0;
    querySnapshot.forEach(doc => {
      const matricol = doc.data().numarMatricol;
      if (matricol) {
        const number = parseInt(matricol.substring(1));
        if (!isNaN(number) && number > maxNumber) {
          maxNumber = number;
        }
      }
    });

    // Generate the next matricol number
    const nextNumber = maxNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating matricol number:', error);
    return null;
  }
}; 