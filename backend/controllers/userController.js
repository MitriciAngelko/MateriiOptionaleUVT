const db = require('../config/firebase').firestore();
const { userExists } = require('../utils/userUtils');

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
      const admin = require('../config/firebase');
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

module.exports = { 
  createUser, 
  updateUserProfile, 
  updateStudentMedia, 
  getUserInfo 
};
