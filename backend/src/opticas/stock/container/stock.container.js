const pool = require('../../../config/db'); // ajusta la ruta

const TransactionManager = require('../../../core/database/transaction-manager');  // el mismo que usan citas/consultas
const StockRepository = require('../repository/stock.repository');
const StockService = require('../services/stock.service');
const StockController = require('../controllers/stock.controller');
const ProductosRepository = require('../../productos/repository/productos.repository');
const SucursalesRepository = require('../../sucursales/repository/sucursales.repository');


const transactionManager = new TransactionManager(pool)
const stockRepository = new StockRepository(pool);
const productosRepository = new ProductosRepository(pool);
const sucursalesRepository = new SucursalesRepository(pool);

const stockService = new StockService(
    stockRepository,
    productosRepository,
    sucursalesRepository,
    transactionManager
);
const stockController = new StockController(stockService);

module.exports = { stockController };