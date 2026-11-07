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
    actualizarPacienteSchema,
    sucursalParamsSchema,
    pacienteParamsSchema,
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

// GET /api/opticas/pacientes
// Dueño: toda la óptica. Encargado/empleado: su sucursal.
router.get(
    '/',
    pacienteController.listarPacientes.bind(pacienteController)
);


router.get(
    '/sucursal/:sucursalId',
    validate(sucursalParamsSchema, 'params'),
    pacienteController.obtenerPacientes.bind(pacienteController)
);

router.get(
    '/:id',
    validate(pacienteParamsSchema, 'params'),
    pacienteController.obtenerPacientePorId.bind(pacienteController)
);

router.patch(
    '/:id',
    validate(pacienteParamsSchema, 'params'),
    validate(actualizarPacienteSchema),
    pacienteController.actualizarPaciente.bind(pacienteController)
);

router.patch(
    '/:id/deactivate',
    soloRol('dueno', 'encargado'),
    validate(pacienteParamsSchema, 'params'),
    pacienteController.desactivarPaciente.bind(pacienteController)
);

router.patch(
    '/:id/activate',
    soloRol('dueno', 'encargado'),
    validate(pacienteParamsSchema, 'params'),
    pacienteController.activarPaciente.bind(pacienteController)
);

module.exports = router;