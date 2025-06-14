const admin = require('../config/firebase');

/**
 * Middleware pentru verificarea rolului utilizatorului
 * @param {string|string[]} requiredRoles - Rolul sau rolurile necesare
 * @returns {Function} - Middleware de verificare a rolului
 */
const checkRole = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      console.log('Role Middleware - Checking role:', requiredRoles);
      
      const token = req.headers.authorization?.split('Bearer ')[1];
      if (!token) {
        console.log('Role Middleware - No token provided');
        return res.status(401).json({ message: 'No token provided' });
      }

      console.log('Role Middleware - Verifying token...');
      const decodedToken = await admin.auth().verifyIdToken(token);
      const uid = decodedToken.uid;
      console.log('Role Middleware - Token verified for user:', uid);

      // Verifică rolul în Firestore
      console.log('Role Middleware - Checking Firestore for user data...');
      const userDoc = await admin.firestore().collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        console.log('Role Middleware - User not found in Firestore');
        return res.status(404).json({ message: 'User not found' });
      }

      const userData = userDoc.data();
      console.log('Role Middleware - User data:', userData);
      
      // Check if user has a role or tip field
      const userRole = userData.role || userData.tip || 'user';
      
      // Check if email is admin (special case)
      const isAdminByEmail = userData.email?.endsWith('@admin.com') || false;
      console.log('Role Middleware - User role:', userRole, 'Is admin by email:', isAdminByEmail);
      
      // Dacă requiredRoles este un array, verificăm dacă rolul utilizatorului este în array
      // Altfel, verificăm dacă rolul utilizatorului este egal cu requiredRoles
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      // Allow admin access if the role matches OR if the email is an admin email
      const hasRequiredRole = roles.includes(userRole) || (roles.includes('admin') && isAdminByEmail);
      
      if (!hasRequiredRole) {
        console.log('Role Middleware - Insufficient permissions');
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      console.log('Role Middleware - Access granted');
      req.user = {
        ...req.user,
        role: userRole,
        // Set admin property to true if user has admin role or admin email
        admin: userRole === 'admin' || isAdminByEmail
      };
      
      next();
    } catch (error) {
      console.error('Role Middleware - Error:', error);
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
