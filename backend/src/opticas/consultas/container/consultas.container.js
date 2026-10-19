const pool = require('../../../config/db');


const TransactionManager = require('../../../core/database/transaction-manager');

const ConsultaRepository = require('../repository/consultas.repository');
const ConsultaService = require('../services/consultas.service');
const ConsultaController = require('../controller/consultas.controller');

const PacienteRepository = require('../../pacientes/repository/paciente.repository');
const SucursalesRepository = require('../../sucursales/repository/sucursales.repository');


const transactionManager = new TransactionManager(pool)
const pacienteRepository = new PacienteRepository(pool);
const sucursalesRepository = new SucursalesRepository(pool);

const consultaRepository = new ConsultaRepository(pool);

const consultaService = new ConsultaService(
                        consultaRepository,
                        sucursalesRepository, 
                        pacienteRepository, 
                        transactionManager);

const consultaController = new ConsultaController(consultaService);


module.exports = {
    consultaController
}