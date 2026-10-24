
const pool = require('../../../config/db');

const ConfiguracionRepository = require('../repository/configuracion.repository');
const ConfiguracionService = require('../services/configuracion.service');
const ConfiguracionController = require('../controllers/configuracion.controller');

const configuracionRepository = new ConfiguracionRepository(pool);

const configuracionService = new ConfiguracionService(
    configuracionRepository
);

const configuracionController = new ConfiguracionController(
    configuracionService
);

module.exports = {
    configuracionController
};
