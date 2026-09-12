const express = require('express');
const router = express.Router();
const sucursalesController =require('../controllers/sucursales.controller');
const {autenticar,soloTipo,soloRol} = require('../../../core/middlewares/auth.middleware');


router.use(autenticar,soloTipo('indigo'));
// Consultar sucursales
router.get('/',soloRol('dueno','super_usuario','gerente_sucursal'),sucursalesController.listarSucursales);
// Gerentes disponibles
router.get('/gerentes-disponibles',soloRol('dueno','super_usuario'),sucursalesController.listarGerentesDisponibles);
// Crear sucursal
router.post('/',soloRol('dueno','super_usuario'),sucursalesController.crearSucursal);
// Editar sucursal
router.put('/:id',soloRol('dueno','super_usuario','gerente_sucursal'),sucursalesController.actualizarSucursal);
// Dar de baja
router.patch('/:id/deactivate',soloRol('dueno','super_usuario'),sucursalesController.darDeBaja);
// Dar de alta
router.patch('/:id/activate',soloRol('dueno','super_usuario'),sucursalesController.darDeAlta);
// Cambiar gerente
router.post('/:id/asignar-gerente',soloRol('dueno','super_usuario'),sucursalesController.asignarGerente);

module.exports = router;