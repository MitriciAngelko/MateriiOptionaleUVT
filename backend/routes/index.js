const express = require('express');
const userRoutes = require('./userRoutes');
// const cvRoutes = require('./cvRoutes');
const enrollmentRoutes = require('./enrollmentRoutes');

const router = express.Router();

router.use('/users', userRoutes);
// router.use('/cvs', cvRoutes);
router.use('/enrollment', enrollmentRoutes);

module.exports = router;
