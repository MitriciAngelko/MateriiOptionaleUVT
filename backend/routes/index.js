const express = require('express');
const userRoutes = require('./userRoutes');
const enrollmentRoutes = require('./enrollmentRoutes');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/enrollment', enrollmentRoutes);

module.exports = router;
