import { db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Check if user exists in Firestore
export const userExists = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists();
  } catch (error) {
    console.error('Error checking user existence:', error.message);
    throw new Error('Error checking user existence');
  }
};

// Validate email format for role determination
export const determineUserRole = (email) => {
  if (email.endsWith('@admin.com')) {
    return 'admin';
  } else if (/^[a-z]+\.[a-z]+[0-9]{2}@e-uvt\.ro$/i.test(email)) {
    return 'student';
  } else if (/^[a-z]+\.[a-z]+@e-uvt\.ro$/i.test(email)) {
    return 'professor';
  }
  return 'user';
};

// Validate student media (grade)
export const validateStudentMedia = (media) => {
  return typeof media === 'number' && media >= 0 && media <= 10;
};

// Format error messages for API responses
export const formatApiError = (error) => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  return error.message || 'An unexpected error occurred';
};

// Check if enrollment period is active
export const isEnrollmentPeriodActive = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
};

// Validate preferences array
export const validatePreferences = (preferences) => {
  return Array.isArray(preferences) && preferences.length > 0;
}; 