const express = require('express');
const router = express.Router();

const usuariosRoutes = require('./usuarios/routes/usuarios.routes');
const sucursalesRoutes = require('./sucursales/routes/sucursales.routes');

// /api/optica/usuarios/...
router.use('/usuarios', usuariosRoutes);

// /api/optica/sucursales/...
router.use('/sucursales', sucursalesRoutes);

module.exports = router;