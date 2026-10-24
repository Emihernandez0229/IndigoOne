const pool = require('../../../config/db');
const ProductosRepository = require('../repository/productos.repository');
const ProductosService = require('../services/productos.service');
const ProductosController = require('../controllers/productos.controller');

const productosRepository = new ProductosRepository(pool);
const productosService = new ProductosService(productosRepository);
const productosController = new ProductosController(productosService);

module.exports = { productosController };