

const pool = require('../../../config/db');

const TransactionManager = require('../../../core/database/transaction-manager');

const SucursalesRepository = require('../repository/sucursales.repository');

const SucursalesService = require('../services/sucursales.service');

const SucursalesController = require('../controllers/sucursales.controller');

const transactionManager = new TransactionManager(pool)
const sucursalesRepository = new SucursalesRepository(pool);
const sucursalesService = new SucursalesService(sucursalesRepository, transactionManager);
const sucursalesController  = new SucursalesController(sucursalesService);

module.exports = {
    sucursalesController
}


