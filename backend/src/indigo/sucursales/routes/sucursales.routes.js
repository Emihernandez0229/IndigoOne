const express = require('express');
const router = express.Router();

const sucursalesController = require('../controllers/sucursales.controller');
const { autenticar, soloTipo, soloRol } = require('../../../core/middlewares/auth.middleware');

// Todo esto es cosa del dueño
router.use(autenticar, soloTipo('indigo'), soloRol('dueno'));

router.get('/gerentes-disponibles', sucursalesController.listarGerentesDisponibles);
router.post('/', sucursalesController.crearSucursal);
router.post('/:id/asignar-gerente', sucursalesController.asignarGerente);

module.exports = router;