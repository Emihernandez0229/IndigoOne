
const express = require('express');

const router = express.Router();

const validate = require('../../../core/middlewares/validation.middleware');

const {
    autenticar,
    soloTipo,
    soloRol
} = require('../../../core/middlewares/auth.middleware');

const { 
    crearConsultaBodySchema,
    listarConsultasQuerySchema,
    obtenerConsultaPorIdParamsSchema
 } = require('../schemas/consultas.schema');

const { consultaController } = require('../container/consultas.container');

router.use(
    autenticar,
    soloTipo('optica'),
    soloRol('dueno', 'encargado', 'empleado')
);


/**
 * @route POST /api/optica/consultas
 * @description Registra una nueva consulta (examen de la vista) para un cliente.
 * @access Autenticado. Dueño: debe indicar sucursalId en el body.
 * Gerente/Empleado: se usa la sucursal de su token.
 */
router.post(
    '/',
    validate(crearConsultaBodySchema, 'body'),
    consultaController.crearConsulta.bind(consultaController)
);

/**
 * @route GET /api/optica/consultas
 * @description Lista las consultas de una sucursal, con paginación y filtros opcionales.
 * @access Autenticado. Dueño: debe indicar sucursalId por query.
 * Gerente/Empleado: se usa la sucursal de su token.
 */
router.get(
    '/',
    validate(listarConsultasQuerySchema, 'query'),
    consultaController.obtenerTodasConsultas.bind(consultaController)
);

/**
 * @route GET /api/optica/consultas/:consultaId
 * @description Obtiene el detalle de una consulta por su ID.
 * @access Autenticado. Dueño: cualquier sucursal de su óptica.
 * Gerente/Empleado: solo si la consulta pertenece a su propia sucursal.
 */
router.get(
    '/:consultaId',
    validate(obtenerConsultaPorIdParamsSchema, 'params'),
    consultaController.obtenerConsultaPorId.bind(consultaController)
);
module.exports = router;
