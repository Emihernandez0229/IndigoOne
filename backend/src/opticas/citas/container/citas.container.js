const pool = require('../../../config/db');


const TransactionManager = require('../../../core/database/transaction-manager');
const CitasRepository = require('../repository/citas.repository');
const CitaService = require('../services/citas.service');
const CitaController = require('../controller/citas.controller');

const PacienteRepository = require('../../pacientes/repository/paciente.repository');
const SucursalesRepository = require('../../sucursales/repository/sucursales.repository');


const transactionManager = new TransactionManager(pool)
const pacienteRepository = new PacienteRepository(pool);
const sucursalesRepository = new SucursalesRepository(pool)
const citasRepository = new CitasRepository(pool);

const citaService = new CitaService(
                        citasRepository,
                        pacienteRepository,
                        sucursalesRepository,
                        transactionManager);

const citaController = new CitaController(citaService);


module.exports = {
    citaController
}