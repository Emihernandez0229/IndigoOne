
const express = require('express');
const router = express.Router();
const validate = require('../../../core/middlewares/validation.middleware');

const {
    crearSucursalSchema,
    actualizarSucursalSchema,
    cambiarGerenteSchema,
    asignarGerenteSchema,
    sucursalParamsSchema,
    actualizarSucursalEncargadoSchema,
} = require('../schemas/sucursales.schema');

const { sucursalesController } = require('../container/sucursales.container');
const { autenticar, soloTipo, soloRol } = require('../../../core/middlewares/auth.middleware');


// Middlewares globales: autenticación y tipo de cuenta.
router.use(autenticar, soloTipo('optica'));


const ValidarActulizacionSucursal = (req, res, next) =>{
    const schema = req.user.rol === 'encargado' ? actualizarSucursalEncargadoSchema:actualizarSucursalSchema
    return validate(schema)(req, res, next);
}

/**
 * Obtiene los gerentes disponibles de la óptica.
 * Acceso: dueño.
 */
router.get(
    '/gerentes-disponibles',
    soloRol('dueno'),
    sucursalesController.listarGerentesDisponibles.bind(sucursalesController)
);

/**
 * Obtiene las sucursales de la óptica autenticada.
 * Acceso: dueño.
 */
router.get(
    '/',
    soloRol('dueno', 'encargado', 'empleado'),
    sucursalesController.listarSucursales.bind(sucursalesController)
);

/**
 * Asigna un gerente a una sucursal.
 * Acceso: dueño.
 */
router.post(
    '/gerente',
    soloRol('dueno'),
    validate(asignarGerenteSchema),
    sucursalesController.asignarGerente.bind(sucursalesController)
);

/**
 * Crea una nueva sucursal.
 * Acceso: dueño.
 */
router.post(
    '/',
    soloRol('dueno'),
    validate(crearSucursalSchema),
    sucursalesController.crearSucursal.bind(sucursalesController)
);

/**
 * Obtiene una sucursal por su ID.
 * Acceso: dueño y encargado.
 */
router.get(
    '/:id',
    soloRol('dueno', 'encargado', 'empleado'),
    validate(sucursalParamsSchema, 'params'),
    sucursalesController.obtenerSucursal.bind(sucursalesController)
);

/**
 * Actualiza los datos de una sucursal.
 * Acceso: dueño.
 */
router.patch(
    '/:id',
    soloRol('dueno', 'encargado'),
    validate(sucursalParamsSchema, 'params'),
    ValidarActulizacionSucursal,
    sucursalesController.actualizarSucursal.bind(sucursalesController)
);

/**
 * Desactiva una sucursal.
 * Acceso: dueño.
 */
router.patch(
    '/:id/desactivar',
    soloRol('dueno'),
    validate(sucursalParamsSchema, 'params'),
    sucursalesController.desactivarSucursal.bind(sucursalesController)
);

/**
 * Activa una sucursal.
 * Acceso: dueño.
 */
router.patch(
    '/:id/activar',
    soloRol('dueno'),
    validate(sucursalParamsSchema, 'params'),
    sucursalesController.activarSucursal.bind(sucursalesController)
);

/**
 * Cambia el gerente de una sucursal.
 * Acceso: dueño.
 */
router.patch(
    '/:id/gerente',
    soloRol('dueno'),
    validate(sucursalParamsSchema, 'params'),
    validate(cambiarGerenteSchema),
    sucursalesController.cambiarGerente.bind(sucursalesController)
);

module.exports = router;