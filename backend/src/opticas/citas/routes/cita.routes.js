
const express = require('express');

const router = express.Router();

const validate = require('../../../core/middlewares/validation.middleware');
const {
    autenticar,
    soloTipo,
    soloRol
} = require('../../../core/middlewares/auth.middleware');


const { pacienteController } = require('../container/citas.container');

router.use(
    autenticar,
    soloTipo('optica'),
    soloRol('dueno', 'encargado', 'empleado')
);



/**
 * @route POST /api/citas
 * @description Crea una nueva cita.
 */
router.post(
    '/',
    citaController.crearCita.bind(citaController)
);

/**
 * @route GET /api/citas
 * @description Obtiene todas las citas de la sucursal.
 */
router.get(
    '/',
    citaController.obtenerTodasCitas.bind(citaController)
);

/**
 * @route GET /api/citas/cliente/:clienteId
 * @description Obtiene las citas de un cliente.
 */
router.get(
    '/cliente/:clienteId',
    citaController.obtenerCitasPorCliente.bind(citaController)
);

/**
 * @route GET /api/citas/dia
 * @description Obtiene las citas de una fecha específica.
 * @query fecha
 */
router.get(
    '/dia',
    citaController.obtenerCitasPorDia.bind(citaController)
);

/**
 * @route GET /api/citas/estado
 * @description Obtiene las citas filtradas por estado.
 * @query estado
 */
router.get(
    '/estado',
    citaController.obtenerCitasPorEstado.bind(citaController)
);

/**
 * @route GET /api/citas/:citaId
 * @description Obtiene una cita por su ID.
 */
router.get(
    '/:citaId',
    citaController.obtenerCitaPorId.bind(citaController)
);

/**
 * @route PATCH /api/citas/:citaId
 * @description Actualiza la fecha, hora o motivo de una cita.
 */
router.patch(
    '/:citaId',
    citaController.actualizarCita.bind(citaController)
);

/**
 * @route PATCH /api/citas/:citaId/estado
 * @description Actualiza el estado de una cita.
 */
router.patch(
    '/:citaId/estado',
    citaController.actualizarEstadoCita.bind(citaController)
);

module.exports = router;
