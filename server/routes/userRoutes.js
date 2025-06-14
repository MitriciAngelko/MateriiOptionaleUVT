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

const router = express.Router();

// Rută pentru crearea unui utilizator nou
router.post('/create', verifyToken, createUser);

// Rută pentru actualizarea profilului unui utilizator
router.put('/:uid', verifyToken, updateUserProfile);

// Rută pentru actualizarea mediei academice a unui student (doar admin/profesor)
router.put('/:uid/media', verifyToken, isAdminOrProfessor, updateStudentMedia);

// Rută pentru obținerea informațiilor despre un utilizator
router.get('/:uid', verifyToken, getUserInfo);

// Rută pentru ștergerea unui utilizator (doar admin)
// Use the plain verifyToken middleware first, then in the controller we check for admin rights
router.delete('/:uid', verifyToken, deleteUser);

// Rută pentru ștergerea în masă a tuturor utilizatorilor (EXTREM DE PERICULOASĂ - doar admin)
router.post('/mass-delete', massDeleteAllUsers);

module.exports = router;
