//midleware/authMiddleware.js

const admin = require('../config/firebase');

// Simple logger that respects environment
const logger = {
  info: (message, data = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTH] ${message}`, data);
    }
  },
  error: (message, error = {}) => {
    console.error(`[AUTH ERROR] ${message}`, error);
  },
  warn: (message, data = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[AUTH WARN] ${message}`, data);
    }
  }
};

const verifyToken = async (req, res, next) => {
  logger.info('Verifying token', { headers: Object.keys(req.headers) });
  const token = req.body.token || req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    logger.warn('No token provided');
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }

  logger.info('Token received, verifying...');
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    logger.info('Token verified successfully', { uid: decodedToken.uid });
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
    };  
    
    // Check if this token belongs to an admin by querying Firestore
    try {
      const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        req.user.role = userData.role || userData.tip || 'user';
        req.user.admin = req.user.role === 'admin' || userData.email?.endsWith('@admin.com');
        logger.info('User role determined', { role: req.user.role, admin: req.user.admin });
      } else {
        logger.warn('User document not found in Firestore');
      }
    } catch (firestoreError) {
      logger.error('Error fetching user data from Firestore', firestoreError);
    }
    
    next();
  } catch (error) {
    logger.error('Token verification failed', error);
    res.status(401).json({ message: 'Unauthorized - Invalid token', error: error.message });
  }
};

module.exports = { verifyToken };

