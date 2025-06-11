//midleware/authMiddleware.js

const admin = require('../config/firebase');

const verifyToken = async (req, res, next) => {
    const token = req.body.token || req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || null,
      };  
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized - Invalid token', error: error.message });
  }
};

module.exports = { verifyToken };

