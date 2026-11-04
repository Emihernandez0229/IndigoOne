const express = require('express');
const router = express.Router();

const validate = require('../../../core/middlewares/validation.middleware');

const { autenticar, soloTipo, soloRol } = require('../../../core/middlewares/auth.middleware');

const {
    crearServicioSchema,
    listarServiciosQuerySchema,
    servicioParamsSchema,
    actualizarServicioSchema,
    cambiarEstadoServicioSchema,
} = require('../schemas/servicios.schema');

const { serviciosController } = require('../container/servicios.container');

router.use(autenticar, soloTipo('optica'));


router.get(
    '/categorias',
    serviciosController.listarCategoriasServicios.bind(serviciosController)
);


router.post(
    '/',
    soloRol('dueno'),
    validate(crearServicioSchema),
    serviciosController.crearServicio.bind(serviciosController)
);

router.get(
    '/',
    validate(listarServiciosQuerySchema, 'query'),
    serviciosController.listarServicios.bind(serviciosController)
);

router.get(
    '/:servicioId',
    validate(servicioParamsSchema, 'params'),
    serviciosController.obtenerServicioPorId.bind(serviciosController)
);

router.patch(
    '/:servicioId',
    soloRol('dueno'),
    validate(servicioParamsSchema, 'params'),
    validate(actualizarServicioSchema),
    serviciosController.actualizarServicio.bind(serviciosController)
);

router.patch(
    '/:servicioId/estado',
    soloRol('dueno'),
    validate(servicioParamsSchema, 'params'),
    validate(cambiarEstadoServicioSchema),
    serviciosController.cambiarEstadoServicio.bind(serviciosController)
);


module.exports = router;