const admin = require('../config/firebase');

const checkRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split('Bearer ')[1];
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const decodedToken = await admin.auth().verifyIdToken(token);
      const uid = decodedToken.uid;

      // Verifică rolul în Firestore
      const userDoc = await admin.firestore().collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userData = userDoc.data();
      if (userData.role !== requiredRole) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      req.user = {
        ...req.user,
        role: userData.role
      };
      
      next();
    } catch (error) {
      res.status(401).json({ message: 'Authorization failed', error: error.message });
    }
  };
};

module.exports = { checkRole };
