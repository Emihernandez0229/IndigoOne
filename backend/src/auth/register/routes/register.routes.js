const express = require('express');
const router = express.Router();

const registerController = require('../controllers/register.controller');
const { autenticar, soloTipo, soloRol } = require('../../../core/middlewares/auth.middleware');

// solo indigo da de alta opticas
router.post(
  '/optica-nueva',
  autenticar,
  soloTipo('indigo'),
  soloRol('admin', 'super_admin'),
  registerController.registrarOptica
);


router.post('/optica-usuario', registerController.registrarOpticaUsuario);

router.post(
  '/autorizar',
  autenticar,
  soloTipo('optica'),
  soloRol('dueño', 'encargado'),
  registerController.autorizarRegistro
);


// Se abren desde el link del correo enviado por Resend
router.get('/confirmar', registerController.mostrarConfirmacion);
router.post('/confirmar/aceptar', registerController.aceptarConfirmacion);
router.post('/confirmar/rechazar', registerController.rechazarConfirmacion);

module.exports = router;