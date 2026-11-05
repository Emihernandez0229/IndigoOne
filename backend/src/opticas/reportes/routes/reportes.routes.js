const express = require('express');
const router = express.Router();
const validate = require('../../../core/middlewares/validation.middleware');
const { autenticar, soloTipo, soloRol } = require('../../../core/middlewares/auth.middleware');
const { reporteVentasQuerySchema, reporteServiciosQuerySchema, reporteClientesQuerySchema, reporteCitasQuerySchema, reporteInventarioQuerySchema, reporteMovimientosQuerySchema} = require('../schemas/reportes.schema');
const { reportesController } = require('../container/reportes.container');

router.use(autenticar, soloTipo('optica'), soloRol('dueno', 'encargado', 'empleado'));

router.get('/ventas', validate(reporteVentasQuerySchema, 'query'),
    reportesController.ventas.bind(reportesController));
// (el resumen existente pasa a router.get('/resumen', ...))

router.get('/servicios', soloRol('dueno', 'encargado'),
    validate(reporteServiciosQuerySchema, 'query'),
    reportesController.servicios.bind(reportesController));

router.get('/clientes', soloRol('dueno', 'encargado'),
    validate(reporteClientesQuerySchema, 'query'),
    reportesController.clientes.bind(reportesController));

router.get('/citas', soloRol('dueno', 'encargado'),
    validate(reporteCitasQuerySchema, 'query'),
    reportesController.citas.bind(reportesController));

router.use('/inventario', soloRol('dueno', 'encargado'),
    validate(reporteInventarioQuerySchema, 'query'),
    reportesController.inventario.bind(reportesController)
);

router.use('/inventario/movimientos', soloRol('dueno', 'encargado'),
    validate(reporteMovimientosQuerySchema, 'query'),
    reportesController.movimientos.bind(reportesController)
);

router.use('/resumen', 
    reportesController.resumen.bind(reportesController)
);



module.exports = router;