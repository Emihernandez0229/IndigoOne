const pool = require('../../../config/db');

const transactionManager = require('../../../core/database/transaction-manager');
const SucursalesRepository = require('../../sucursales/repository/sucursales.repository');
const PacienteRepository = require('../../pacientes/repository/paciente.repository')
const VentasRepository = require('../repository/ventas.repository');
const VentasService = require('../services/ventas.service');
const VentasController = require('../controllers/ventas.controller');


const StockService = require('../../stock/services/stock.service');
const StockRepository = require('../../stock/repository/stock.repository')
const ProductosRepository = require('../../productos/repository/productos.repository');


const stockService = new StockService(
    new StockRepository(pool),
    new ProductosRepository(pool),
    new SucursalesRepository(pool),
    new transactionManager(pool)

)


const ventasController = new VentasController(
    new VentasService(
        new VentasRepository(pool),
        new SucursalesRepository(pool),
        new PacienteRepository(pool),
        stockService,            // el mismo armado en el container de stock
        new transactionManager(pool)
    )
);
module.exports = { ventasController };
