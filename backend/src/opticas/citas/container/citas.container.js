const CitaController = require('../controllers/CitaController');
const CitaService = require('../services/CitaService');
const CitasRepository = require('../repositories/CitasRepository');





const citasRepository = new CitasRepository();
const citaService = new CitaService(citasRepository);
const citaController = new CitaController(citaService);


module.exports = {
    citaController
}