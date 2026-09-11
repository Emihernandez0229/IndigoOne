const express = require('express');

const router = express.Router();

const pool = require('../../config/database');

const PacienteRepository = require('../repository/paciente.repository');
const PacienteService = require('../services/paciente.service');
const PacienteController = require('../controllers/paciente.controller');


const pacienteRepository = new PacienteRepository(pool);
const pacienteService = new PacienteService(pacienteRepository);
const pacienteController = new PacienteController(pacienteService);

router.post(
    '/',
    pacienteController.crearPaciente
);

// Leer - pacientes de una sucursal
router.get(
    '/sucursal/:sucursalId',
    pacienteController.obtenerPacientes
);


// Leer - paciente específico
router.get(
    '/:id',
    pacienteController.obtenerPacientePorId
);


// Actualizar
router.put(
    '/:id',
    pacienteController.actualizarPaciente
);

module.exports = router;