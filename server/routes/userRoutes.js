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

module.exports = router;
