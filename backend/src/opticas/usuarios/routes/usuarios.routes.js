const express = require('express');
const router = express.Router();

const validate  = require('../../../core/middlewares/validation.middleware');


const { crearGerenteSchema,
        crearEmpleadoSchema,
        actualizarUsuarioSchema
 } = require('../schemas/usuario.schema');


const {usuariosController} = require('../container/usuario.container');
const { autenticar, soloTipo, soloRol } = require('../../../core/middlewares/auth.middleware');


router.use(autenticar, soloTipo('optica'));


// Crear Gerente
router.post(
    '/gerentes',
    validate(crearGerenteSchema),
    soloRol('dueno'), 
    usuariosController.crearGerente.bind(usuariosController)
);

// Crear Empleado
router.post(
    '/empleados',
    validate(crearEmpleadoSchema),
    soloRol('dueno', 'encargado'),
    usuariosController.crearEmpleado.bind(usuariosController)
);

router.get(
    '/',
    soloRol('dueno', 'encargado'),
    usuariosController.listarUsuarios.bind(usuariosController)
);

router.get(
    '/:id',
    soloRol('dueno', 'encargado'),
    usuariosController.buscarUsuarioPorId.bind(usuariosController)
);

router.patch(
    '/:id',
    soloRol('dueno', 'encargado'),
    validate(actualizarUsuarioSchema),
    usuariosController.actualizarUsuario.bind(usuariosController)
)

module.exports = router;