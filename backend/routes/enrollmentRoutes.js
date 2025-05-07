const express = require('express');
const { 
  proceseazaInscriere, 
  getPreferinteStudent, 
  setPreferinteStudent, 
  getStatusInscriere, 
  setPerioadaInscriere 
} = require('../controllers/enrollmentController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin, isProfessor, isStudent } = require('../middleware/roleMiddleware');

const router = express.Router();

// Rute administrative pentru procesarea înscrierilor
router.post('/process/:pachetId', verifyToken, isAdmin, proceseazaInscriere);
router.post('/period/:pachetId', verifyToken, isAdmin, setPerioadaInscriere);

// Rute pentru studenți pentru gestionarea preferințelor
router.get('/preferences/:studentId/:pachetId', verifyToken, getPreferinteStudent);
router.post('/preferences/:studentId/:pachetId', verifyToken, isStudent, setPreferinteStudent);

// Rute pentru obținerea informațiilor despre înscrieri
router.get('/status/:pachetId', verifyToken, getStatusInscriere);

module.exports = router; 