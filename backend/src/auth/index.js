const express = require('express');
const router = express.Router();

const loginRoutes = require('./login/routes/login.routes');

// /api/auth/login/...
router.use('/login', loginRoutes);

module.exports = router;