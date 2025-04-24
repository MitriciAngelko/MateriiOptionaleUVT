const admin = require('../config/firebase');

/**
 * Middleware pentru verificarea rolului utilizatorului
 * @param {string|string[]} requiredRoles - Rolul sau rolurile necesare
 * @returns {Function} - Middleware de verificare a rolului
 */
const checkRole = (requiredRoles) => {
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
      const userRole = userData.role;
      
      // Dacă requiredRoles este un array, verificăm dacă rolul utilizatorului este în array
      // Altfel, verificăm dacă rolul utilizatorului este egal cu requiredRoles
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      if (!roles.includes(userRole)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      req.user = {
        ...req.user,
        role: userRole
      };
      
      next();
    } catch (error) {
      res.status(401).json({ message: 'Authorization failed', error: error.message });
    }
  };
};

// Middleware pentru rolul de administrator
const isAdmin = checkRole('admin');

// Middleware pentru rolul de student
const isStudent = checkRole('student');

// Middleware pentru rolul de profesor
const isProfessor = checkRole('professor');

// Middleware pentru rolul de admin sau profesor
const isAdminOrProfessor = checkRole(['admin', 'professor']);

module.exports = { 
  checkRole, 
  isAdmin, 
  isStudent, 
  isProfessor, 
  isAdminOrProfessor 
};
