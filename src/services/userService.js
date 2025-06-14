import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  getAuth
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { 
  setDoc, 
  doc, 
  collection, 
  getDocs, 
  query, 
  where, 
  getDoc, 
  updateDoc, 
  arrayUnion 
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getNextMatricolNumber } from '../utils/generators/matricolGenerator';
import { executeWithRetry } from '../utils/rateLimiter';

// Create a secondary Firebase app instance for user creation
// This prevents the admin from being logged out when creating new users
let secondaryApp = null;
let secondaryAuth = null;

const getSecondaryAuth = () => {
  if (!secondaryApp) {
    // Use the same config as the main app but with a different name
    const firebaseConfig = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID
    };
    
    secondaryApp = initializeApp(firebaseConfig, 'secondary');
    secondaryAuth = getAuth(secondaryApp);
  }
  return secondaryAuth;
};

/**
 * Updates materii with professor information
 * @param {string} userId - User ID of the professor
 * @param {Array} materiiSelectate - Selected materii
 * @param {string} numeProfesor - Professor's full name
 */
export const updateMateriiCuProfesor = async (userId, materiiSelectate, numeProfesor) => {
  try {
    for (const materie of materiiSelectate) {
      const materieDoc = doc(db, 'materii', materie.id);
      await updateDoc(materieDoc, {
        profesorId: userId,
        profesorNume: numeProfesor
      });
    }
  } catch (error) {
    console.error('Error updating materii with professor:', error);
    throw error;
  }
};

/**
 * Assigns mandatory courses and creates academic history for student
 * @param {string} studentId - Student ID
 * @param {Object} studentData - Student data
 */
export const assignMandatoryCoursesAndCreateIstoric = async (studentId, studentData) => {
  try {
    // Find mandatory courses
    const materiiQuery = query(
      collection(db, 'materii'),
      where('tip', '==', 'obligatorie'),
      where('facultate', '==', studentData.facultate),
      where('specializare', '==', studentData.specializare),
      where('an', '==', studentData.an)
    );

    const materiiSnapshot = await getDocs(materiiQuery);
    const materiiObligatorii = [];
    
    materiiSnapshot.forEach(doc => {
      materiiObligatorii.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Create enrollment records
    for (const materie of materiiObligatorii) {
      const enrollmentData = {
        studentId: studentId,
        studentNume: `${studentData.prenume} ${studentData.nume}`,
        studentEmail: studentData.email,
        studentSpecializare: studentData.specializare,
        studentAn: studentData.an,
        studentFacultate: studentData.facultate,
        materieId: materie.id,
        materieNume: materie.nume,
        materieFacultate: materie.facultate,
        materieSpecializare: materie.specializare,
        materieAn: materie.an,
        materieTip: materie.tip,
        dataInscriere: new Date(),
        status: 'inscris',
        anAcademic: new Date().getFullYear(),
        semestru: materie.semestru || 1
      };

      await setDoc(doc(collection(db, 'enrollments')), enrollmentData);
    }

    // Create academic history record
    const istoricData = {
      studentId: studentId,
      studentNume: `${studentData.prenume} ${studentData.nume}`,
      studentEmail: studentData.email,
      anAcademic: new Date().getFullYear(),
      facultate: studentData.facultate,
      specializare: studentData.specializare,
      an: studentData.an,
      materii: materiiObligatorii.map(materie => ({
        materieId: materie.id,
        materieNume: materie.nume,
        materieTip: materie.tip,
        nota: null,
        status: 'in_curs',
        credite: materie.credite || 5,
        semestru: materie.semestru || 1
      })),
      dataCreare: new Date(),
      status: 'activ'
    };

    await setDoc(doc(collection(db, 'istoricAcademic')), istoricData);

  } catch (error) {
    console.error('Error assigning mandatory courses:', error);
    throw error;
  }
};

/**
 * Creates a new user account without logging out the current admin
 * @param {Object} userData - User data for creation
 * @param {Array} materiiSelectate - Selected materii for professors
 * @param {Function} onUserCreated - Callback after user creation
 * @returns {Promise<Object>} - Created user data
 */
export const createUser = async (userData, materiiSelectate = [], onUserCreated) => {
  return await executeWithRetry(async () => {
    try {
      console.log('Creating user with secondary auth to prevent admin logout...');
      
      // Use secondary auth instance to prevent logging out the current admin
      const secondaryAuth = getSecondaryAuth();
      
      // Create user account using secondary auth with retry logic
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        userData.email, 
        userData.password
      );
      const user = userCredential.user;

      console.log('User created successfully with UID:', user.uid);

      // Generate matricol number for students
      let numarMatricol = null;
      if (userData.tip === 'student') {
        numarMatricol = await getNextMatricolNumber(userData.specializare);
      }

      // Prepare user data for Firestore
      const firestoreData = {
        uid: user.uid,
        email: userData.email,
        nume: userData.nume,
        prenume: userData.prenume,
        tip: userData.tip,
        dataCreare: new Date(),
        activ: true
      };

      // Add type-specific fields
      if (userData.tip === 'student') {
        Object.assign(firestoreData, {
          anNastere: userData.anNastere,
          facultate: userData.facultate,
          specializare: userData.specializare,
          an: userData.an,
          numarMatricol: numarMatricol
        });
      } else if (userData.tip === 'profesor') {
        Object.assign(firestoreData, {
          facultate: userData.facultate,
          functie: userData.functie,
          materiiPredate: materiiSelectate.map(m => m.id)
        });
      }

      // Save to Firestore
      await setDoc(doc(db, 'users', user.uid), firestoreData);
      console.log('User data saved to Firestore');

      // Handle professor-specific operations
      if (userData.tip === 'profesor' && materiiSelectate.length > 0) {
        await updateMateriiCuProfesor(
          user.uid, 
          materiiSelectate, 
          `${userData.prenume} ${userData.nume}`
        );
        console.log('Professor materii updated');
      }

      // Handle student-specific operations
      if (userData.tip === 'student') {
        await assignMandatoryCoursesAndCreateIstoric(user.uid, firestoreData);
        console.log('Student mandatory courses assigned');
      }

      // Sign out from secondary auth to clean up
      await secondaryAuth.signOut();
      console.log('Secondary auth signed out');

      // Call callback
      if (onUserCreated) {
        onUserCreated({
          uid: user.uid,
          ...firestoreData
        });
      }

      console.log('User creation completed successfully');
      return {
        uid: user.uid,
        ...firestoreData
      };

    } catch (error) {
      console.error('Error creating user:', error);
      
      // Clean up secondary auth in case of error
      try {
        const secondaryAuth = getSecondaryAuth();
        await secondaryAuth.signOut();
      } catch (cleanupError) {
        console.error('Error cleaning up secondary auth:', cleanupError);
      }
      
      throw error;
    }
  }, {
    maxRetries: 3,
    baseDelay: 2000, // Start with 2 second delay
    retryableErrors: ['auth/too-many-requests', 'RATE_LIMIT_EXCEEDED', 'quota-exceeded', 'too-many-requests']
  });
};

/**
 * Updates an existing user
 * @param {string} userId - User ID to update
 * @param {Object} userData - Updated user data
 * @param {Array} materiiSelectate - Selected materii for professors
 * @returns {Promise<Object>} - Updated user data
 */
export const updateUser = async (userId, userData, materiiSelectate = []) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Prepare update data
    const updateData = {
      nume: userData.nume,
      prenume: userData.prenume,
      dataModificare: new Date()
    };

    // Add type-specific fields
    if (userData.tip === 'student') {
      Object.assign(updateData, {
        anNastere: userData.anNastere,
        facultate: userData.facultate,
        specializare: userData.specializare,
        an: userData.an
      });
    } else if (userData.tip === 'profesor') {
      Object.assign(updateData, {
        facultate: userData.facultate,
        functie: userData.functie,
        materiiPredate: materiiSelectate.map(m => m.id)
      });
    }

    await updateDoc(userRef, updateData);

    // Handle professor-specific operations
    if (userData.tip === 'profesor' && materiiSelectate.length > 0) {
      await updateMateriiCuProfesor(
        userId, 
        materiiSelectate, 
        `${userData.prenume} ${userData.nume}`
      );
    }

    return {
      uid: userId,
      ...updateData
    };

  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}; 