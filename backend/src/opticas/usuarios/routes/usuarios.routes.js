const express = require('express');
const router = express.Router();

const usuariosController = require('../controllers/usuarios.controller');
const { autenticar, soloTipo, soloRol } = require('../../../core/middlewares/auth.middleware');

router.use(autenticar, soloTipo('optica'));

router.post('/gerentes', soloRol('dueno'), usuariosController.crearGerente);

router.post('/empleados', soloRol('dueno', 'encargado'), usuariosController.crearEmpleado);

module.exports = router;