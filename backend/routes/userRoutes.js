const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { createUser } = require('../controllers/userController');
const router = express.Router();

router.post('/create', verifyToken, createUser);

module.exports = router;
