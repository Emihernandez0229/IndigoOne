const express = require('express');
const router = express.Router();

const validate = require('../../../core/middlewares/validation.middleware');
const {
    autenticar,
    soloTipo,
    soloRol
} = require('../../../core/middlewares/auth.middleware');

const {
    crearPacienteSchema,
    actualizarPacienteSchema
} = require('../schemas/pacientes.schema');

const { pacienteController } = require('../container/paciente.container');

router.use(
    autenticar,
    soloTipo('optica'),
    soloRol('dueno', 'encargado', 'empleado')
);

router.post(
    '/',
    validate(crearPacienteSchema),
    pacienteController.crearPaciente.bind(pacienteController)
);

router.get(
    '/sucursal/:sucursalId',
    pacienteController.obtenerPacientes.bind(pacienteController)
);

router.get(
    '/:id',
    pacienteController.obtenerPacientePorId.bind(pacienteController)
);

router.patch(
    '/:id',
    validate(actualizarPacienteSchema),
    pacienteController.actualizarPaciente.bind(pacienteController)
);

module.exports = router;