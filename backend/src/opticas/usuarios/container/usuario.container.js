

const pool = require('../../../config/db');

const TransactionManager = require('../../../core/database/transaction-manager');

const UsuariosRepository = require('../repository/usuarios.repositoy');

const UsuarioService = require('../services/usuarios.service.js');

const UsuariosController = require('../controllers/usuarios.controller.js');



const transactionManager = new TransactionManager(pool);
const usuariosRepository = new UsuariosRepository(pool);
const usuariosService = new UsuarioService(usuariosRepository, transactionManager);
const usuariosController = new UsuariosController(usuariosService);

module.exports = {
    usuariosController
}