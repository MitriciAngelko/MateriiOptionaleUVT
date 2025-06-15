const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { 
  createUser, 
  updateUserProfile, 
  updateStudentMedia, 
  getUserInfo,
  deleteUser,
  massDeleteAllUsers
} = require('../controllers/userController');
const { isAdmin, isAdminOrProfessor } = require('../middleware/roleMiddleware');
const { generalLimit, strictLimit, massOperationsLimit } = require('../middleware/rateLimiter');

const router = express.Router();

// Rută pentru crearea unui utilizator nou
router.post('/create', generalLimit, verifyToken, createUser);

// Rută pentru actualizarea profilului unui utilizator
router.put('/:uid', generalLimit, verifyToken, updateUserProfile);

// Rută pentru actualizarea mediei academice a unui student (doar admin/profesor)
router.put('/:uid/media', strictLimit, verifyToken, isAdminOrProfessor, updateStudentMedia);

// Rută pentru obținerea informațiilor despre un utilizator
router.get('/:uid', generalLimit, verifyToken, getUserInfo);

// Rută pentru ștergerea unui utilizator (doar admin)
// Use the plain verifyToken middleware first, then in the controller we check for admin rights
router.delete('/:uid', strictLimit, verifyToken, deleteUser);

// Rută pentru ștergerea în masă a tuturor utilizatorilor (EXTREM DE PERICULOASĂ - doar admin)
router.post('/mass-delete', massOperationsLimit, verifyToken, isAdmin, massDeleteAllUsers);

// Development-only endpoint to reset rate limiter (only in development)
if (process.env.NODE_ENV !== 'production') {
  const { resetRateLimiter } = require('../middleware/rateLimiter');
  
  router.post('/reset-rate-limit', verifyToken, isAdmin, (req, res) => {
    try {
      const clientIP = req.ip || req.connection.remoteAddress;
      resetRateLimiter('massOperations', clientIP);
      
      res.status(200).json({
        success: true,
        message: 'Mass operations rate limiter reset successfully',
        resetFor: clientIP
      });
    } catch (error) {
      console.error('Error resetting rate limiter:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset rate limiter',
        error: error.message
      });
    }
  });
}

module.exports = router;
