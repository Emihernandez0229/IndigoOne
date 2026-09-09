const express = require('express');
const router = express.Router();

const sucursalesController = require('../controllers/sucursales.controller');
const { autenticar, soloTipo, soloRol } = require('../../../core/middlewares/auth.middleware');

router.use(autenticar, soloTipo('optica'), soloRol('dueno'));

router.get('/gerentes-disponibles', sucursalesController.listarGerentesDisponibles);

router.post('/', sucursalesController.crearSucursal);

module.exports = router;