const express = require('express');
const router = express.Router();

const validate  = require('../../../core/middlewares/validation.middleware');


const { crearGerenteSchema,
        crearEmpleadoSchema,
        actualizarUsuarioSchema,
        usuarioParamsSchema,
        actualizarPerfilSchema
 } = require('../schemas/usuario.schema');


const {usuariosController} = require('../container/usuario.container');
const { autenticar, soloTipo, soloRol } = require('../../../core/middlewares/auth.middleware');

/**
 * Valida el body de actualización según el rol: el empleado solo
 * puede editar su información personal.
 */
const validarActualizacionUsuario = (req, res, next) => {
    const schema = req.user.rol === 'empleado'
        ? actualizarPerfilSchema
        : actualizarUsuarioSchema;

    return validate(schema)(req, res, next);
};

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
    soloRol('dueno', 'encargado', 'empleado'),
    usuariosController.listarUsuarios.bind(usuariosController)
);

router.get(
    '/:id',
    soloRol('dueno', 'encargado', 'empleado'),
    validate(usuarioParamsSchema, 'params'),
    usuariosController.buscarUsuarioPorId.bind(usuariosController)
);

router.patch(
    '/:id',
    soloRol('dueno', 'encargado', 'empleado'),
    validate(usuarioParamsSchema, 'params'),
    validarActualizacionUsuario,
    usuariosController.actualizarUsuario.bind(usuariosController)
);

module.exports = router;