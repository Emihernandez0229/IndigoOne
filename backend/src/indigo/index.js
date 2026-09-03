const express = require('express');
const router = express.Router();

const usuariosRoutes = require('./usuarios/routes/usuarios.routes');
const clientesRoutes = require('./clientes/routes/clientes.routes');
const sucursalesRoutes = require('./sucursales/routes/sucursales.routes');

// /api/indigo/usuarios/...
router.use('/usuarios', usuariosRoutes);

// /api/indigo/clientes/...
router.use('/clientes', clientesRoutes);

// /api/indigo/sucursales/...
router.use('/sucursales', sucursalesRoutes);

module.exports = router;