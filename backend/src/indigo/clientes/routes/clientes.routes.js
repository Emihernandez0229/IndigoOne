const express = require('express');
const router = express.Router();

const clientesController = require('../controllers/clientes.controller');
const { autenticar, soloTipo, soloRol } = require('../../../core/middlewares/auth.middleware');

router.post(
  '/',
  autenticar,
  soloTipo('indigo'),
  soloRol('dueno', 'gerente_sucursal'),
  clientesController.crearOptica
);

router.get(
  '/buscar',
  autenticar,
  soloTipo('indigo'),
  soloRol('dueno', 'gerente_sucursal'),
  clientesController.buscarPorCodigo
);

router.post(
  '/asignar-proveedor',
  autenticar,
  soloTipo('indigo'),
  soloRol('dueno', 'gerente_sucursal'),
  clientesController.asignarProveedor
);

module.exports = router;