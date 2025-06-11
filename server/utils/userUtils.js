const db = require('../config/firebase').firestore();

// Verifică dacă utilizatorul există deja în Firestore
const userExists = async (uid) => {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    return userDoc.exists; // Returnează true dacă utilizatorul există
  } catch (error) {
    console.error('Error checking user existence:', error.message);
    throw new Error('Error checking user existence');
  }
};

module.exports = { userExists };
