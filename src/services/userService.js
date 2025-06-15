import { 
  createUserWithEmailAndPassword, 
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
import { db } from '../firebase';
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
      const materieRef = doc(db, 'materii', materie.id);
      
      // Get current materie data to check existing professors
      const materieDoc = await getDoc(materieRef);
      if (!materieDoc.exists()) {
        console.warn(`Materie with ID ${materie.id} not found`);
        continue;
      }
      
      const materieData = materieDoc.data();
      let profesori = materieData.profesori || [];
      
      // Check if professor is already assigned to this course
      const existingProfessor = profesori.find(prof => prof.id === userId);
      
      if (!existingProfessor) {
        // Add professor to the array using the new format
        profesori.push({
          id: userId,
          nume: numeProfesor
        });
        
        await updateDoc(materieRef, {
          profesori: profesori
        });
        
        console.log(`Professor ${numeProfesor} added to course: ${materie.nume}`);
      } else {
        console.log(`Professor ${numeProfesor} already assigned to course: ${materie.nume}`);
      }
    }
  } catch (error) {
    console.error('Error updating materii with professor:', error);
    throw error;
  }
};

/**
 * Removes a professor from courses they're no longer assigned to
 * @param {string} userId - User ID of the professor
 * @param {Array} materiiToRemove - Materii to remove professor from
 * @param {string} numeProfesor - Professor's full name
 */
export const removeProfessorFromMaterii = async (userId, materiiToRemove, numeProfesor) => {
  try {
    for (const materie of materiiToRemove) {
      const materieRef = doc(db, 'materii', materie.id);
      
      // Get current materie data
      const materieDoc = await getDoc(materieRef);
      if (!materieDoc.exists()) {
        continue;
      }
      
      const materieData = materieDoc.data();
      let profesori = materieData.profesori || [];
      
      // Remove professor from the array
      profesori = profesori.filter(prof => prof.id !== userId);
      
      await updateDoc(materieRef, {
        profesori: profesori
      });
      
      console.log(`Professor ${numeProfesor} removed from course: ${materie.nume}`);
    }
  } catch (error) {
    console.error('Error removing professor from materii:', error);
    throw error;
  }
};

/**
 * Assigns mandatory courses and creates academic history for student
 * @param {string} studentId - Student ID
 * @param {Object} studentData - Student data
 */
/**
 * Creates basic academic history structure for non-student users
 * @param {string} userId - User ID
 * @param {Object} userData - User data
 */
export const createBasicAcademicHistory = async (userId, userData) => {
  try {
    console.log(`📋 Creating basic academic history for ${userData.tip}: ${userData.prenume} ${userData.nume}`);

    // Check if academic history already exists
    const existingIstoricRef = doc(db, 'istoricAcademic', userId);
    const existingIstoricDoc = await getDoc(existingIstoricRef);
    
    if (existingIstoricDoc.exists()) {
      console.log(`ℹ️ Academic history already exists for ${userData.tip}: ${userData.prenume} ${userData.nume} - skipping creation`);
      return;
    }

    // Create basic academic history structure
    const basicIstoricData = {
      studentId: userId, // Keep the field name consistent, even for non-students
      nume: userData.nume || '',
      prenume: userData.prenume || '',
      specializare: userData.specializare || '', // Will be empty for professors/secretaries
      facultate: userData.facultate || '',
      tip: userData.tip, // Store user type for reference
      istoricAnual: [] // Empty array - can be used later if needed
    };

    // Save using the userId as the document ID
    await setDoc(doc(db, 'istoricAcademic', userId), basicIstoricData);

    console.log(`✅ Created basic academic history for ${userData.tip}: ${basicIstoricData.prenume} ${basicIstoricData.nume}`);

  } catch (error) {
    console.error(`❌ Error creating basic academic history for ${userData.tip}:`, error);
    throw error;
  }
};

export const assignMandatoryCoursesAndCreateIstoric = async (studentId, studentData) => {
  try {
    console.log(`📚 CRITICAL: Enrolling student ${studentData.prenume} ${studentData.nume} in mandatory courses...`);
    console.log(`   - Faculty: ${studentData.facultate}`);
    console.log(`   - Specialization: ${studentData.specializare}`);
    console.log(`   - Year: ${studentData.an}`);

    // ✅ CHECK: Don't overwrite existing academic history
    const existingIstoricRef = doc(db, 'istoricAcademic', studentId);
    const existingIstoricDoc = await getDoc(existingIstoricRef);
    
    if (existingIstoricDoc.exists()) {
      console.log(`ℹ️ Academic history already exists for student ${studentData.prenume} ${studentData.nume} - skipping creation`);
      console.log(`📚 Proceeding with mandatory course enrollment only...`);
      // Continue with course enrollment but skip history creation
    } else {
      console.log(`📝 No existing academic history found - will create new structure`);
    }

    // Find mandatory courses for ALL 3 academic years (I, II, III)
    const materiiQuery = query(
      collection(db, 'materii'),
      where('obligatorie', '==', true),
      where('facultate', '==', studentData.facultate),
      where('specializare', '==', studentData.specializare)
      // Remove the 'an' filter to get courses for all years
    );

    const materiiSnapshot = await getDocs(materiiQuery);
    const materiiObligatorii = [];
    
    materiiSnapshot.forEach(doc => {
      materiiObligatorii.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`📖 Found ${materiiObligatorii.length} mandatory courses for ALL years (${studentData.facultate} - ${studentData.specializare})`);

    if (materiiObligatorii.length === 0) {
      console.log(`ℹ️ No mandatory courses found for ${studentData.facultate} - ${studentData.specializare} - ALL YEARS`);
      
      // Only create academic history if it doesn't already exist
      if (!existingIstoricDoc.exists()) {
        console.log(`📝 Creating empty academic history structure...`);
        
        // Create empty academic history structure even if no mandatory courses exist
        const emptyIstoricData = {
          studentId: studentId,
          nume: studentData.nume || '',
          prenume: studentData.prenume || '',
          specializare: studentData.specializare || '',
          facultate: studentData.facultate || '',
          istoricAnual: [] // Empty array - courses will be added later
        };

        // Save the empty structure
        await setDoc(doc(db, 'istoricAcademic', studentId), emptyIstoricData);
        
        console.log(`✅ Created empty academic history structure for: ${emptyIstoricData.prenume} ${emptyIstoricData.nume}`);
      } else {
        console.log(`ℹ️ Academic history already exists, skipping creation`);
      }
      
      return; // Exit early since no courses to process
    }

    // Prepare student info for enrollment with null checks
    const studentInfo = {
      id: studentId || '',
      nume: `${studentData.prenume || ''} ${studentData.nume || ''}`.trim() || 'Student Necunoscut',
      numarMatricol: studentData.numarMatricol || 'N/A'
    };

    const materiiIds = [];

    // CRITICAL: Enroll student ONLY in courses for their CURRENT year
    const currentYearCourses = materiiObligatorii.filter(materie => materie.an === studentData.an);
    console.log(`📚 Enrolling in ${currentYearCourses.length} courses for current year (${studentData.an})`);
    
    for (const materie of currentYearCourses) {
      try {
        console.log(`📖 Enrolling in: ${materie.nume} (${materie.id}) - Year ${materie.an}`);
        
        // Get current materie document to check if student is already enrolled
        const materieRef = doc(db, 'materii', materie.id);
        const materieDoc = await getDoc(materieRef);
        
        if (materieDoc.exists()) {
          const materieData = materieDoc.data();
          const studentiActuali = materieData.studentiInscrisi || [];
          
          // Check if student is not already enrolled
          if (!studentiActuali.some(student => student.id === studentId)) {
            await updateDoc(materieRef, {
              studentiInscrisi: arrayUnion(studentInfo)
            });
            
            materiiIds.push(materie.id);
            console.log(`   ✅ Successfully enrolled in ${materie.nume}`);
          } else {
            // If already enrolled, still add to the list for the user document
            materiiIds.push(materie.id);
            console.log(`   ℹ️ Already enrolled in ${materie.nume}`);
          }
        }
      } catch (materieError) {
        console.error(`   ❌ Failed to enroll in ${materie.nume}:`, materieError);
        // Continue with other courses even if one fails
      }
    }

    // CRITICAL: Update student's materiiInscrise array with all mandatory course IDs
    if (materiiIds.length > 0) {
      const userRef = doc(db, 'users', studentId);
      await updateDoc(userRef, {
        materiiInscrise: arrayUnion(...materiiIds)
      });
      
      console.log(`✅ Updated student document with ${materiiIds.length} mandatory courses`);
    }

    // 🆕 CREATE MODERN ACADEMIC HISTORY STRUCTURE
    console.log(`📋 Creating modern academic history structure...`);

    // Determine current academic year
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11
    const anUniversitar = month < 9 ? 
      `${year-1}-${year}` : // For months Jan-Aug, use previous-current year
      `${year}-${year+1}`;  // For months Sep-Dec, use current-next year

    // 🎯 Group courses by YEAR and SEMESTER for ALL 3 academic years
    const cursuriBySemestru = {};
    const academicYears = ['I', 'II', 'III'];
    
    // Process courses for ALL academic years
    academicYears.forEach(anStudiu => {
      const coursesForYear = materiiObligatorii.filter(materie => materie.an === anStudiu);
      console.log(`📚 Processing ${coursesForYear.length} courses for Year ${anStudiu}`);
      
      coursesForYear.forEach(materie => {
        const semestru = materie.semestru || 1;
        const key = `${anStudiu}-${semestru}`; // e.g., "I-1", "I-2", "II-1", etc.
        
        if (!cursuriBySemestru[key]) {
          cursuriBySemestru[key] = {
            anStudiu: anStudiu,
            semestru: semestru,
            cursuri: []
          };
        }
        
        // Create course record with modern structure
        const courseRecord = {
          id: materie.id,
          nume: materie.nume,
          credite: materie.credite || 0,
          nota: 0, // Grade 0 - not evaluated yet
          dataNota: new Date().getTime(), // Use timestamp
          profesor: 'Nespecificat', // Professor will be assigned when available
          obligatorie: true,
          status: 'neevaluat'
        };
        
        cursuriBySemestru[key].cursuri.push(courseRecord);
      });
    });

    // Create the modern academic history structure for ALL years
    const istoricAnual = [];

    // Add records for each year-semester combination that has courses
    Object.keys(cursuriBySemestru).forEach(key => {
      const semesterData = cursuriBySemestru[key];
      
      const anualRecord = {
        anUniversitar: anUniversitar,
        anStudiu: semesterData.anStudiu,
        semestru: semesterData.semestru,
        cursuri: semesterData.cursuri
      };
      
      istoricAnual.push(anualRecord);
      console.log(`📋 Added academic record: Year ${semesterData.anStudiu}, Semester ${semesterData.semestru}, Courses: ${semesterData.cursuri.length}`);
    });

    // Create the complete academic history document with modern structure
    const modernIstoricData = {
      studentId: studentId,
      nume: studentData.nume || '',
      prenume: studentData.prenume || '',
      specializare: studentData.specializare || '',
      facultate: studentData.facultate || '',
      istoricAnual: istoricAnual
    };

    // Only create academic history if it doesn't already exist
    if (!existingIstoricDoc.exists()) {
      // Save using the studentId as the document ID (this is critical!)
      await setDoc(doc(db, 'istoricAcademic', studentId), modernIstoricData);

      console.log(`✅ Created modern academic history for student: ${modernIstoricData.prenume} ${modernIstoricData.nume}`);
      console.log(`📊 Academic history summary:`);
      console.log(`   - Academic year: ${anUniversitar}`);
      console.log(`   - Student's current year: ${studentData.an}`);
      console.log(`   - Academic records created for ALL 3 years (I, II, III)`);
      console.log(`   - Year-Semester combinations: ${Object.keys(cursuriBySemestru).join(', ')}`);
      console.log(`   - Total courses added to history: ${materiiObligatorii.length}`);
      console.log(`   - Successfully enrolled in current year courses: ${materiiIds.length}`);
    } else {
      console.log(`ℹ️ Academic history already exists, skipping creation`);
      console.log(`📊 Enrollment summary:`);
      console.log(`   - Total courses found: ${materiiObligatorii.length}`);
      console.log(`   - Successfully enrolled in materii: ${materiiIds.length}`);
    }

  } catch (error) {
    console.error('❌ Error assigning mandatory courses and creating academic history:', error);
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
      } else {
        // Create basic academic history structure for non-students (professors, secretaries)
        // This ensures all users have an academic history document for consistency
        await createBasicAcademicHistory(user.uid, firestoreData);
        console.log('Basic academic history created for non-student user');
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
    
    // Get current user data to compare professor assignments
    const currentUserDoc = await getDoc(userRef);
    const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() : {};
    
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
    if (userData.tip === 'profesor') {
      const professorName = `${userData.prenume} ${userData.nume}`;
      const newMateriiIds = materiiSelectate.map(m => m.id);
      const oldMateriiIds = currentUserData.materiiPredate || [];
      
      // Find courses to add and remove
      const materiiToAdd = materiiSelectate.filter(m => !oldMateriiIds.includes(m.id));
      const materiiToRemove = [];
      
      // For courses to remove, we need to get the full course objects
      for (const oldMaterieId of oldMateriiIds) {
        if (!newMateriiIds.includes(oldMaterieId)) {
          // Get the course data for removal
          const materieDoc = await getDoc(doc(db, 'materii', oldMaterieId));
          if (materieDoc.exists()) {
            materiiToRemove.push({
              id: oldMaterieId,
              ...materieDoc.data()
            });
          }
        }
      }
      
      // Add professor to new courses
      if (materiiToAdd.length > 0) {
        await updateMateriiCuProfesor(userId, materiiToAdd, professorName);
        console.log(`Added professor to ${materiiToAdd.length} new courses`);
      }
      
      // Remove professor from old courses
      if (materiiToRemove.length > 0) {
        await removeProfessorFromMaterii(userId, materiiToRemove, professorName);
        console.log(`Removed professor from ${materiiToRemove.length} courses`);
      }
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

/**
 * Migration function to convert old professor format to new format
 * This fixes existing courses that use profesorId/profesorNume instead of profesori array
 */
export const migrateProfessorDataFormat = async () => {
  try {
    console.log('Starting migration of professor data format...');
    
    const materiiSnapshot = await getDocs(collection(db, 'materii'));
    let migratedCount = 0;
    
    for (const materieDoc of materiiSnapshot.docs) {
      const materieData = materieDoc.data();
      const materieRef = doc(db, 'materii', materieDoc.id);
      
      // Check if this course uses old format (has profesorId but no profesori array)
      if (materieData.profesorId && !materieData.profesori) {
        console.log(`Migrating course: ${materieData.nume}`);
        
        // Create new profesori array from old data
        const profesori = [{
          id: materieData.profesorId,
          nume: materieData.profesorNume || 'Profesor Necunoscut'
        }];
        
        // Update course with new format and remove old fields
        await updateDoc(materieRef, {
          profesori: profesori,
          profesorId: null,
          profesorNume: null
        });
        
        migratedCount++;
        console.log(`  ✅ Migrated: ${materieData.nume}`);
      }
    }
    
    console.log(`Migration completed! Migrated ${migratedCount} courses.`);
    return { success: true, migratedCount };
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}; 