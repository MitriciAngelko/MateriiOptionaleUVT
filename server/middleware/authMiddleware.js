//midleware/authMiddleware.js

const admin = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  console.log('Auth Middleware - Headers:', req.headers);
  const token = req.body.token || req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    console.log('Auth Middleware - No token provided');
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }

  console.log('Auth Middleware - Token received, verifying...');
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Auth Middleware - Token verified successfully for user:', decodedToken.uid);
    
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
        console.log('Auth Middleware - User role:', req.user.role, 'Admin:', req.user.admin);
      } else {
        console.log('Auth Middleware - User document not found in Firestore');
      }
    } catch (firestoreError) {
      console.error('Auth Middleware - Error fetching user data from Firestore:', firestoreError);
    }
    
    next();
  } catch (error) {
    console.error('Auth Middleware - Token verification failed:', error);
    res.status(401).json({ message: 'Unauthorized - Invalid token', error: error.message });
  }
};

module.exports = { verifyToken };

