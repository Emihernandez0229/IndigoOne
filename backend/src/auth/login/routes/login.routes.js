const express = require('express');
const router = express.Router();

const loginController = require('../controllers/login.controller');
const { autenticar, soloTipo } = require('../../../core/middlewares/auth.middleware');


router.post('/indigo', loginController.loginIndigo);
router.post('/optica', loginController.loginOptica);


router.post(
  '/optica/cambiar-password',
  autenticar,
  soloTipo('optica'),
  loginController.cambiarPassword
);

module.exports = router;