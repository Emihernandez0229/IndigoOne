const express = require('express');
const router = express.Router();

const usuariosController = require('../controllers/usuarios.controller');
const { autenticar, soloTipo, soloRol } = require('../../../core/middlewares/auth.middleware');

router.post('/bootstrap-super-usuario', usuariosController.crearPrimerSuperUsuario);

router.use(autenticar, soloTipo('indigo'));

// De aqui para abajo ya todo pide login
router.post('/super-usuarios', soloRol('super_usuario'), usuariosController.crearSuperUsuario);
router.post('/duenos', soloRol('super_usuario'), usuariosController.crearDueno);
router.post('/gerentes', soloRol('dueno'), usuariosController.crearGerenteSucursal);
router.post('/empleados', soloRol('gerente_sucursal'), usuariosController.crearEmpleado);

module.exports = router;