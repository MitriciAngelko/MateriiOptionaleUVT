const express = require('express');
const userRoutes = require('./userRoutes');
// const cvRoutes = require('./cvRoutes');

const router = express.Router();

router.use('/users', userRoutes);
// router.use('/cvs', cvRoutes);

module.exports = router;
