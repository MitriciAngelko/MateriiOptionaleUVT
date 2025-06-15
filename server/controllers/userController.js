const db = require('../config/firebase').firestore();
const { userExists } = require('../utils/userUtils');
const admin = require('../config/firebase');

const createUser = async (req, res) => {
  try {
    const { uid, email } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ 
        message: 'Missing required fields: uid and email are required' 
      });
    }

    // Verifică dacă utilizatorul există deja
    const exists = await userExists(uid);
    if (exists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Determină rolul în funcție de email
    let role = 'user';

    if (email.endsWith('@admin.com')) {
      role = 'admin';
    } else if (/^[a-z]+\.[a-z]+[0-9]{2}@e-uvt\.ro$/i.test(email)) {
      role = 'student';
    } else if (/^[a-z]+\.[a-z]+@e-uvt\.ro$/i.test(email)) {
      role = 'professor';
    }

    // Creează un nou utilizator cu rol
    const userRef = db.collection('users').doc(uid);
    await userRef.set({
      uid,
      email,
      role,
      createdAt: new Date().toISOString()
    });

    // Setează custom claims pentru toate rolurile specifice
    if (role !== 'user') {
      await admin.auth().setCustomUserClaims(uid, { role });
    }

    res.status(201).json({ message: 'User created successfully', role });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

/**
 * Actualizează datele profilului unui utilizator
 */
const updateUserProfile = async (req, res) => {
  try {
    const { uid } = req.params;
    const updateData = req.body;
    
    if (!uid) {
      return res.status(400).json({ 
        message: 'Missing required field: uid is required' 
      });
    }
    
    // Verifică dacă utilizatorul există
    const exists = await userExists(uid);
    if (!exists) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Elimină câmpurile care nu trebuie actualizate
    const { uid: userId, role, email, createdAt, ...allowedFields } = updateData;
    
    // Actualizează doar câmpurile permise
    const userRef = db.collection('users').doc(uid);
    await userRef.update(allowedFields);
    
    res.status(200).json({ message: 'User profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Error updating user profile', error: error.message });
  }
};

/**
 * Actualizează media academică a unui student
 */
const updateStudentMedia = async (req, res) => {
  try {
    const { uid } = req.params;
    const { media } = req.body;
    
    if (!uid) {
      return res.status(400).json({ 
        message: 'Missing required field: uid is required' 
      });
    }
    
    if (typeof media !== 'number' || media < 0 || media > 10) {
      return res.status(400).json({ 
        message: 'Media trebuie să fie un număr între 0 și 10' 
      });
    }
    
    // Verifică dacă utilizatorul există și este student
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userData = userDoc.data();
    if (userData.role !== 'student') {
      return res.status(400).json({ 
        message: 'Media poate fi actualizată doar pentru studenți' 
      });
    }
    
    // Actualizează media studentului
    await userRef.update({ media });
    
    res.status(200).json({ 
      message: 'Media studentului a fost actualizată cu succes',
      uid,
      media
    });
  } catch (error) {
    console.error('Error updating student media:', error);
    res.status(500).json({ 
      message: 'Error updating student media', 
      error: error.message 
    });
  }
};

/**
 * Obține informații despre un utilizator
 */
const getUserInfo = async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid) {
      return res.status(400).json({ 
        message: 'Missing required field: uid is required' 
      });
    }
    
    // Verifică dacă utilizatorul există
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Exclude câmpurile sensibile
    const userData = userDoc.data();
    const { password, ...safeUserData } = userData;
    
    res.status(200).json(safeUserData);
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ 
      message: 'Error fetching user info', 
      error: error.message 
    });
  }
};

/**
 * Mass delete all users from Firebase Authentication and Firestore
 * EXTREMELY DANGEROUS OPERATION - USE WITH CAUTION
 */
const massDeleteAllUsers = async (req, res) => {
  try {
    console.log('Starting mass deletion of all users...');
    
    let authDeletedCount = 0;
    let firestoreDeletedCount = 0;
    let errors = [];
    let skippedCount = 0;

    // Define protected admin emails that should never be deleted
    // These accounts are critical for system administration and must be preserved
    const protectedEmails = ['admin@admin.com'];

    // Get all users from Firebase Auth
    let allUsers = [];
    let nextPageToken;
    
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      allUsers = allUsers.concat(listUsersResult.users);
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`Found ${allUsers.length} users in Firebase Auth`);
    console.log(`Protected emails that will be preserved: ${protectedEmails.join(', ')}`);

    // Delete users from Firebase Auth (excluding protected accounts)
    for (const user of allUsers) {
      try {
        // Skip protected admin accounts
        if (protectedEmails.includes(user.email)) {
          console.log(`🔒 SKIPPING protected admin account: ${user.email}`);
          skippedCount++;
          continue;
        }

        await admin.auth().deleteUser(user.uid);
        authDeletedCount++;
        console.log(`Deleted user from Auth: ${user.email || user.uid}`);
      } catch (error) {
        console.error(`Failed to delete user from Auth: ${user.uid}`, error);
        errors.push(`Auth deletion failed for ${user.uid}: ${error.message}`);
      }
    }

    // Collect all user IDs that will be deleted (for materii cleanup)
    const deletedUserIds = [];
    
    // Delete user documents from Firestore (excluding protected accounts)
    const usersSnapshot = await admin.firestore().collection('users').get();
    
    for (const doc of usersSnapshot.docs) {
      try {
        const uid = doc.id;
        const userData = doc.data();
        
        // Skip protected admin accounts
        if (protectedEmails.includes(userData.email)) {
          console.log(`🔒 SKIPPING protected admin document: ${userData.email} (${uid})`);
          skippedCount++;
          continue;
        }
        
        // Add to deletion list for materii cleanup
        deletedUserIds.push(uid);
        
        // Delete related collections
        // Delete istoric academic
        const istoricSnapshot = await admin.firestore()
          .collection('istoricAcademic')
          .where('studentId', '==', uid)
          .get();
        
        for (const istoricDoc of istoricSnapshot.docs) {
          await istoricDoc.ref.delete();
        }

        // Delete enrollments
        const enrollmentsSnapshot = await admin.firestore()
          .collection('enrollments')
          .where('studentId', '==', uid)
          .get();
        
        for (const enrollmentDoc of enrollmentsSnapshot.docs) {
          await enrollmentDoc.ref.delete();
        }

        // Delete user document
        await doc.ref.delete();
        firestoreDeletedCount++;
        console.log(`Deleted user document: ${uid}`);
      } catch (error) {
        console.error(`Failed to delete user document: ${doc.id}`, error);
        errors.push(`Firestore deletion failed for ${doc.id}: ${error.message}`);
      }
    }

    // Cleanup user references from materii documents
    console.log(`Starting cleanup of user references from materii documents...`);
    console.log(`Will remove ${deletedUserIds.length} user IDs from materii collections`);
    
    let materiiUpdatedCount = 0;
    try {
      const materiiSnapshot = await admin.firestore().collection('materii').get();
      
      for (const materieDoc of materiiSnapshot.docs) {
        try {
          const materieData = materieDoc.data();
          const materieId = materieDoc.id;
          let needsUpdate = false;
          const updates = {};

          console.log(`🔍 Checking materie: ${materieData.nume} (ID: ${materieId})`);

          // Clean up studentiInscrisi array
          if (materieData.studentiInscrisi && Array.isArray(materieData.studentiInscrisi)) {
            const originalLength = materieData.studentiInscrisi.length;
            const cleanedStudenti = materieData.studentiInscrisi.filter(student => {
              const shouldKeep = !deletedUserIds.includes(student.id);
              if (!shouldKeep) {
                console.log(`  📋 Removing student: ${student.nume} (ID: ${student.id})`);
              }
              return shouldKeep;
            });

            if (cleanedStudenti.length !== originalLength) {
              updates.studentiInscrisi = cleanedStudenti;
              needsUpdate = true;
              console.log(`  ✏️  Updated studentiInscrisi: ${originalLength} -> ${cleanedStudenti.length}`);
            }
          }

          // Clean up profesori array
          if (materieData.profesori && Array.isArray(materieData.profesori)) {
            const originalLength = materieData.profesori.length;
            const cleanedProfesori = materieData.profesori.filter(profesor => {
              const shouldKeep = !deletedUserIds.includes(profesor.id);
              if (!shouldKeep) {
                console.log(`  👨‍🏫 Removing professor: ${profesor.nume} (ID: ${profesor.id})`);
              }
              return shouldKeep;
            });

            if (cleanedProfesori.length !== originalLength) {
              updates.profesori = cleanedProfesori;
              needsUpdate = true;
              console.log(`  ✏️  Updated profesori: ${originalLength} -> ${cleanedProfesori.length}`);
            }
          }

          // Apply updates if needed
          if (needsUpdate) {
            await admin.firestore().collection('materii').doc(materieId).update(updates);
            materiiUpdatedCount++;
            console.log(`  ✅ Successfully updated materie: ${materieData.nume}`);
          } else {
            console.log(`  ⏭️  No updates needed for materie: ${materieData.nume}`);
          }

        } catch (materieError) {
          console.error(`  ❌ Error processing materie ${materieDoc.id}:`, materieError);
          errors.push(`Materie cleanup failed for ${materieDoc.id}: ${materieError.message}`);
        }
      }

      console.log(`📊 Materii cleanup summary: ${materiiUpdatedCount} materii documents updated`);

    } catch (materiiError) {
      console.error('Error during materii cleanup:', materiiError);
      errors.push(`Materii cleanup failed: ${materiiError.message}`);
    }

    console.log(`Mass deletion completed. Auth: ${authDeletedCount}, Firestore: ${firestoreDeletedCount}, Skipped: ${skippedCount}, Materii Updated: ${materiiUpdatedCount}`);

    res.status(200).json({
      success: true,
      message: 'Mass deletion completed (protected admin accounts preserved, materii references cleaned)',
      authDeletedCount,
      firestoreDeletedCount,
      skippedCount,
      materiiUpdatedCount,
      protectedEmails,
      totalErrors: errors.length,
      errors: errors.slice(0, 10) // Only return first 10 errors to avoid huge response
    });

  } catch (error) {
    console.error('Mass deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Mass deletion failed',
      error: error.message
    });
  }
};

/**
 * Șterge un utilizator din Firebase Authentication
 */
const deleteUser = async (req, res) => {
  const { uid } = req.params;
  
  console.log(`Delete User Controller - Request to delete user: ${uid}`);
  
  if (!uid) {
    console.log('Delete User Controller - Missing uid parameter');
    return res.status(400).json({ 
      message: 'Missing required field: uid is required' 
    });
  }
  
  // Check if the request comes from an admin or the admin@admin.com user
  if (!req.user.admin && req.user.email !== 'admin@admin.com') {
    console.log(`Delete User Controller - Unauthorized deletion attempt by user: ${req.user.uid} (${req.user.email})`);
    return res.status(403).json({ 
      message: 'Unauthorized: only administrators can delete users' 
    });
  }
  
  console.log(`Delete User Controller - Admin authorization confirmed: ${req.user.uid}`);
  console.log(`Delete User Controller - Attempting to delete user: ${uid}`);

  // Get Firebase Admin SDK reference
  const adminAuth = admin.auth();
  
  // Use the exact method from Firebase documentation with Promise chaining
  adminAuth.deleteUser(uid)
    .then(() => {
      console.log(`Delete User Controller - Successfully deleted user: ${uid}`);
      res.status(200).json({ 
        message: 'User successfully deleted from authentication system', 
        uid 
      });
    })
    .catch((error) => {
      console.error(`Delete User Controller - Error deleting user: ${uid}`, error);
      
      // Special handling for user-not-found
      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({
          message: 'User not found in authentication system',
          uid
        });
      }
      
      // Return detailed error response
      res.status(500).json({
        message: 'Error deleting user from authentication system',
        error: error.message,
        code: error.code
      });
    });
};

module.exports = {
  createUser,
  updateUserProfile,
  updateStudentMedia,
  getUserInfo,
  deleteUser,
  massDeleteAllUsers
};
