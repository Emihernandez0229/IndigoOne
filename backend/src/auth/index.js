const express = require('express');
const router = express.Router();

const loginRoutes = require('./login/routes/login.routes');
const registerRoutes = require('./register/routes/register.routes');

// /api/auth/login/...
router.use('/login', loginRoutes);

// /api/auth/register/...
router.use('/register', registerRoutes);

module.exports = router;