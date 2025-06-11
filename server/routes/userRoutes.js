const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { 
  createUser, 
  updateUserProfile, 
  updateStudentMedia, 
  getUserInfo 
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

module.exports = router;
