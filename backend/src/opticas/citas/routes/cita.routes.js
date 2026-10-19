
const express = require('express');

const router = express.Router();

const validate = require('../../../core/middlewares/validation.middleware');

const {
    autenticar,
    soloTipo,
    soloRol
} = require('../../../core/middlewares/auth.middleware');

const {
    crearCitaSchema,
    listarCitasSchema,
    obtenerCitaPorIdSchema,
    actualizarCitaParamsSchema,
    actualizarCitaBodySchema,
    actualizarEstadoParamsSchema,
    actualizarEstadoBodySchema
 } = require('../schemas/citas.schema');

const { citaController } = require('../container/citas.container');

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
    validate(crearCitaSchema),
    citaController.crearCita.bind(citaController)
);

/**
 * @route GET /api/citas
 * @description Obtiene las citas de la sucursal del usuario autenticado,
 * sin importar su estado, con paginación.
 * @query {number} [limit=20] - Máximo de citas a devolver (1-100).
 * @query {number} [offset=0] - Cantidad de citas a omitir.
 * @access Autenticado (autorización por rol pendiente).
 */
router.get(
    '/',
    validate(listarCitasSchema, 'query'),
    citaController.obtenerTodasCitas.bind(citaController)
);


/**
 * @route GET /api/citas/:citaId
 * @description Obtiene una cita por su ID.
 */
router.get(
    '/:citaId',
    validate(obtenerCitaPorIdSchema, 'params'),
    citaController.obtenerCitaPorId.bind(citaController)
);


/**
 * @route PATCH /api/optica/citas/:citaId
 * @description Actualiza la fecha/hora y/o el motivo de una cita.
 * No permite cambiar el estado (ver PATCH /:citaId/estado).
 * @access Autenticado. Dueño: cualquier sucursal de su óptica.
 * Gerente/Empleado: solo citas de su propia sucursal.
 */
router.patch(
    '/:citaId',
    validate(actualizarCitaParamsSchema, 'params'),
    validate(actualizarCitaBodySchema, 'body'),
    citaController.actualizarCita.bind(citaController)
);

/**
 * @route PATCH /api/citas/:citaId/estado
 * @description Actualiza el estado de una cita.
 */
router.patch(
    '/:citaId/estado',
    validate(actualizarEstadoParamsSchema, 'params'),
    validate(actualizarEstadoBodySchema),
    citaController.actualizarEstadoCita.bind(citaController)
);

module.exports = router;
