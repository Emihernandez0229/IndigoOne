const express = require('express');
const router = express.Router();

const usuariosRoutes = require('./usuarios/routes/usuarios.routes');
const sucursalesRoutes = require('./sucursales/routes/sucursales.routes');

const pacienteRoutes = require('./pacientes/routes/paciente.routes');

const citasRoutes = require('./citas/routes/cita.routes');

const consultasRoutes = require('./consultas/routes/consultas.route');

const productosRoutes = require('./productos/routes/productos.routes');

const serviciosRoutes = require('./servicios/routes/servicios.routes');

const stockRoutes = require('./stock/routes/stock.routes');

const configuracionRoutes = require('./configuracion/routes/configuracion.routes');

// /api/optica/usuarios/...
router.use('/usuarios', usuariosRoutes);

// /api/optica/sucursales/...
router.use('/sucursales', sucursalesRoutes);


// /api/optica/sucursales/  Seccion pacientes -- V.1.0
router.use('/pacientes', pacienteRoutes);

router.use('/citas', citasRoutes);

router.use('/consultas', consultasRoutes);

router.use('/productos', productosRoutes);

router.use('/servicios', serviciosRoutes);

router.use('/stock', stockRoutes);

router.use('/configuracion', configuracionRoutes);

module.exports = router;