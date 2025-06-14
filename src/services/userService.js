import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  getAuth
} from 'firebase/auth';
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

    await setDoc(doc(collection(db, 'istoric_academic')), istoricData);

  } catch (error) {
    console.error('Error assigning mandatory courses:', error);
    throw error;
  }
};

/**
 * Creates a new user account
 * @param {Object} userData - User data for creation
 * @param {Array} materiiSelectate - Selected materii for professors
 * @param {Function} onUserCreated - Callback after user creation
 * @returns {Promise<Object>} - Created user data
 */
export const createUser = async (userData, materiiSelectate = [], onUserCreated) => {
  const currentAdmin = auth.currentUser;
  
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const user = userCredential.user;

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

    // Handle professor-specific operations
    if (userData.tip === 'profesor' && materiiSelectate.length > 0) {
      await updateMateriiCuProfesor(
        user.uid, 
        materiiSelectate, 
        `${userData.prenume} ${userData.nume}`
      );
    }

    // Handle student-specific operations
    if (userData.tip === 'student') {
      await assignMandatoryCoursesAndCreateIstoric(user.uid, firestoreData);
    }

    // Re-authenticate admin
    if (currentAdmin) {
      await signInWithEmailAndPassword(auth, currentAdmin.email, userData.adminPassword);
    }

    // Call callback
    if (onUserCreated) {
      onUserCreated({
        uid: user.uid,
        ...firestoreData
      });
    }

    return {
      uid: user.uid,
      ...firestoreData
    };

  } catch (error) {
    // Re-authenticate admin in case of error
    if (currentAdmin) {
      try {
        await signInWithEmailAndPassword(auth, currentAdmin.email, userData.adminPassword);
      } catch (reAuthError) {
        console.error('Re-authentication failed:', reAuthError);
      }
    }
    throw error;
  }
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