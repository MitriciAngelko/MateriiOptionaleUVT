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

module.exports = { createUser };
