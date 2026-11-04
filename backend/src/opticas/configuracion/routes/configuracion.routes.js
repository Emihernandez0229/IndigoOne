
const express = require('express');
const router = express.Router();

const validate = require('../../../core/middlewares/validation.middleware');

const { autenticar, soloTipo, soloRol } = require('../../../core/middlewares/auth.middleware');

const {
    configuracionController
} = require('../container/configuracion.container');


const {
    crearConfiguracionSchema,
    actualizarConfiguracionSchema
} = require('../schemas/configuracion.schema');

router.use(autenticar, soloTipo('optica'));



// Datos visuales y operativos para la interfaz.
router.get(
    '/operativa',
    soloRol('dueno', 'encargado', 'empleado'),
    configuracionController.obtenerOperativa
);

// Configuración completa: exclusivamente dueño.
router.get(
    '/',
    soloRol('dueno'),
    configuracionController.obtener
);

router.post(
    '/',
    soloRol('dueno'),
    validate(crearConfiguracionSchema),
    configuracionController.crear.bind(configuracionController)
);

router.patch(
    '/',
    soloRol('dueno'),
    validate(actualizarConfiguracionSchema),
    configuracionController.actualizar
);

module.exports = router;
