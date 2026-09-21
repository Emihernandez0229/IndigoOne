

const pool = require('../../../config/db');


const PacienteRepository = require('../repository/paciente.repository');
const PacienteService = require('../services/paciente.service');

const PacienteController = require('../controllers/paciente.controller');


const pacienteRepository = new PacienteRepository(pool);
const pacienteService = new PacienteService(pacienteRepository);
const pacienteController = new PacienteController(pacienteService);


module.exports = {
    pacienteController
}