const express = require('express');
const router = express.Router();

const validate = require('../../../core/middlewares/validation.middleware');

const { autenticar, soloTipo, soloRol } = require('../../../core/middlewares/auth.middleware');

const { 
    crearProductoSchema,
    listarProductosQuerySchema,
    productoParamsSchema,
    actualizarProductoSchema,
    cambiarEstadoProductoSchema
} = require('../schemas/productos.schema');
const { productosController } = require('../container/productos.container');

router.use(autenticar, soloTipo('optica'));


router.get(
    '/categorias',
    productosController.listarCategoriasProductos.bind(productosController)
);


/**
 * @route POST /api/optica/productos
 * @description Crea un producto en el catálogo de la óptica.
 * @access Solo dueño.
 */
router.post(
    '/',
    soloRol('dueno'),
    validate(crearProductoSchema),
    productosController.crearProducto.bind(productosController)
);

/**
 * @route GET /api/optica/productos
 * @description Lista el catálogo de productos de la óptica, con paginación y filtros.
 * @access Dueño, gerente y empleado.
 */
router.get(
    '/',
    validate(listarProductosQuerySchema, 'query'),
    productosController.listarProductos.bind(productosController)
);


/**
 * @route GET /api/optica/productos/:productoId
 * @description Obtiene el detalle de un producto del catálogo.
 * @access Dueño, gerente y empleado.
 */
router.get(
    '/:productoId',
    validate(productoParamsSchema, 'params'),
    productosController.obtenerProductoPorId.bind(productosController)
);


/**
 * @route PATCH /api/optica/productos/:productoId
 * @description Edita datos del producto (no cambia el estado).
 * @access Solo dueño.
 */
router.patch(
    '/:productoId',
    soloRol('dueno'),
    validate(productoParamsSchema, 'params'),
    validate(actualizarProductoSchema),
    productosController.actualizarProducto.bind(productosController)
);

/**
 * @route PATCH /api/optica/productos/:productoId/estado
 * @description Activa o desactiva un producto del catálogo.
 * @access Solo dueño.
 */
router.patch(
    '/:productoId/estado',
    soloRol('dueno'),
    validate(productoParamsSchema, 'params'),
    validate(cambiarEstadoProductoSchema),
    productosController.cambiarEstadoProducto.bind(productosController)
);


module.exports = router;