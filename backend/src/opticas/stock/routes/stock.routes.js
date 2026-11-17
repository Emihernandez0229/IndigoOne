const express = require('express');
const router = express.Router();

const validate = require('../../../core/middlewares/validation.middleware');

const { autenticar, soloTipo, soloRol } = require('../../../core/middlewares/auth.middleware');

const {
    listarStockQuerySchema,
    stockParamsSchema,
    ajustarStockSchema,
    listarMovimientosQuerySchema,
} = require('../schemas/stock.schema');

const { stockController } = require('../container/stock.container');

router.use(autenticar, soloTipo('optica'));

/** Existencias de una sucursal. Dueño indica ?sucursalId; los demás usan el token. */
router.get(
    '/',
    soloRol('dueno', 'encargado', 'empleado'),
    validate(listarStockQuerySchema, 'query'),
    stockController.listarStock.bind(stockController)
);

/** Historial de movimientos de un producto en una sucursal. */
router.get(
    '/:productoId/movimientos',
    soloRol('dueno', 'encargado'),
    validate(stockParamsSchema, 'params'),
    validate(listarMovimientosQuerySchema, 'query'),
    stockController.listarMovimientos.bind(stockController)
);

/** Ajusta existencias y/o stock mínimo. */
router.patch(
    '/:productoId',
    soloRol('dueno', 'encargado'),
    validate(stockParamsSchema, 'params'),
    validate(ajustarStockSchema),
    stockController.ajustarStock.bind(stockController)
);

module.exports = router;