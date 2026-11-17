const express = require('express');
const router = express.Router();

const validate = require('../../../core/middlewares/validation.middleware');

const { autenticar, soloTipo, soloRol } = require('../../../core/middlewares/auth.middleware');
const {
    crearVentaSchema,
    ventaParamsSchema, 
    listarVentasQuerySchema,
    liquidarVentaSchema,
    cambiarEstadoVentaSchema,
} = require('../schemas/ventas.schemas');

const { ventasController } = require('../container/ventas.container');

router.use(autenticar, soloTipo('optica'), soloRol('dueno', 'encargado', 'empleado'));



router.post(
    '/',
    validate(crearVentaSchema),
    ventasController.crear.bind(ventasController)
);

router.get(
    '/',
    validate(listarVentasQuerySchema, 'query'),
    ventasController.listar.bind(ventasController)
);

router.get(
    '/:ventaId',
    validate(ventaParamsSchema, 'params'),
    ventasController.obtener.bind(ventasController)
);

router.patch('/:ventaId/liquidar',
    validate(ventaParamsSchema, 'params'),
    validate(liquidarVentaSchema),
    ventasController.liquidar.bind(ventasController)
);

router.patch('/:ventaId/estado',
    validate(ventaParamsSchema, 'params'),
    validate(cambiarEstadoVentaSchema),
    ventasController.cambiarEstado.bind(ventasController)
);

router.patch('/:ventaId/cancelar',
    soloRol('dueno', 'encargado'),
    validate(ventaParamsSchema, 'params'),
    ventasController.cancelar.bind(ventasController)
);

module.exports = router;