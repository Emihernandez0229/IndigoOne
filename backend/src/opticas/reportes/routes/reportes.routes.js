const express = require('express');
const router = express.Router();
const validate = require('../../../core/middlewares/validation.middleware');
const { autenticar, soloTipo, soloRol } = require('../../../core/middlewares/auth.middleware');
const {
    reporteResumenQuerySchema,
    reporteVentasQuerySchema,
    reporteServiciosQuerySchema,
    reporteClientesQuerySchema,
    reporteClientesActividadQuerySchema,
    reporteCitasQuerySchema,
    reporteInventarioQuerySchema,
    reporteMovimientosQuerySchema,
    reporteServiciosDetalleQuerySchema
} = require('../schemas/reportes.schema');
const { reportesController } = require('../container/reportes.container');

router.use(autenticar, soloTipo('optica'), soloRol('dueno', 'encargado', 'empleado'));

router.get('/resumen', validate(reporteResumenQuerySchema, 'query'),
    reportesController.resumen.bind(reportesController));

router.get('/ventas', validate(reporteVentasQuerySchema, 'query'),
    reportesController.ventas.bind(reportesController));

router.get('/servicios', soloRol('dueno', 'encargado'),
    validate(reporteServiciosQuerySchema, 'query'),
    reportesController.servicios.bind(reportesController));

router.get('/clientes', soloRol('dueno', 'encargado'),
    validate(reporteClientesQuerySchema, 'query'),
    reportesController.clientes.bind(reportesController));

router.get('/clientes/actividad', soloRol('dueno', 'encargado'),
    validate(reporteClientesActividadQuerySchema, 'query'),
    reportesController.clientesActividad.bind(reportesController));

router.get('/citas', soloRol('dueno', 'encargado'),
    validate(reporteCitasQuerySchema, 'query'),
    reportesController.citas.bind(reportesController));

router.get('/inventario', soloRol('dueno', 'encargado'),
    validate(reporteInventarioQuerySchema, 'query'),
    reportesController.inventario.bind(reportesController));

router.get('/inventario/movimientos', soloRol('dueno', 'encargado'),
    validate(reporteMovimientosQuerySchema, 'query'),
    reportesController.movimientos.bind(reportesController));
router.get('/servicios/detalle', soloRol('dueno', 'encargado'),
    validate(reporteServiciosDetalleQuerySchema, 'query'),
    reportesController.serviciosDetalle.bind(reportesController));
module.exports = router;