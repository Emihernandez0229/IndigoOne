const express = require('express');
const router = express.Router();

const usuariosRoutes = require('./usuarios/routes/usuarios.routes');
const sucursalesRoutes = require('./sucursales/routes/sucursales.routes');

const pacienteRoutes = require('./pacientes/routes/paciente.routes');

const citasRoutes = require('./citas/routes/cita.routes');

const consultasRoutes = require('./consultas/routes/consultas.route')

// /api/optica/usuarios/...
router.use('/usuarios', usuariosRoutes);

// /api/optica/sucursales/...
router.use('/sucursales', sucursalesRoutes);


// /api/optica/sucursales/  Seccion pacientes -- V.1.0
router.use('/pacientes', pacienteRoutes);

router.use('/citas', citasRoutes);

router.use('/consultas', consultasRoutes);

module.exports = router;