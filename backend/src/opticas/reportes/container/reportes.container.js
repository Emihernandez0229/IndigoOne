const pool = require('../../../config/db');

const ReportesRepository = require('../repository/reporte.repository');
const ReportesController = require('../controllers/reportes.controller');
const ReportesService = require('../services/reportes.service')
const SucursalesRepository = require('../../sucursales/repository/sucursales.repository');

const reportesController = new ReportesController(
    new ReportesService(new ReportesRepository(pool), new SucursalesRepository(pool))
);
module.exports = { reportesController };