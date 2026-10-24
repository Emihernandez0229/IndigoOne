const pool = require('../../../config/db');
const ServiciosRepository = require('../repository/servicios.repository');
const ServiciosService = require('../services/servicios.service');
const ServiciosController = require('../controllers/servicios.controller');

const serviciosRepository = new ServiciosRepository(pool);
const serviciosService = new ServiciosService(serviciosRepository);
const serviciosController = new ServiciosController(serviciosService);

module.exports = { serviciosController };