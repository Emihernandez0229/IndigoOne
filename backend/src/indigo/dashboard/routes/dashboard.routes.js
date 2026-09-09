const express = require('express');
const router = express.Router();

const {
  autenticar,
  soloTipo,
} = require('../../../core/middlewares/auth.middleware');

const dashboardController = require('../controllers/dashboard.controller');

router.get(
  '/',
  autenticar,
  soloTipo('indigo'),
  dashboardController.obtenerDashboard
);

module.exports = router;