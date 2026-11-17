const express = require('express');
const router = express.Router();

const usuariosRoutes = require('./usuarios/routes/usuarios.routes');
const clientesRoutes = require('./clientes/routes/clientes.routes');
const sucursalesRoutes = require('./sucursales/routes/sucursales.routes');
const dashboardRoutes = require('./dashboard/routes/dashboard.routes');
const trabajosRoutes = require('./trabajos/routes/trabajos.routes');
const inventarioRoutes = require('./inventario/routes/inventario.routes');


// /api/indigo/usuarios/...
router.use('/usuarios', usuariosRoutes);

// /api/indigo/clientes/...
router.use('/clientes', clientesRoutes);

// /api/indigo/sucursales/...
router.use('/sucursales', sucursalesRoutes);

// /api/indigo/dashboard/...
router.use('/dashboard', dashboardRoutes);

// /api/indigo/trabajos/...
router.use('/trabajos', trabajosRoutes);

// /api/indigo/inventario/...
router.use('/inventario', inventarioRoutes);

module.exports = router;