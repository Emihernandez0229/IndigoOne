

class PacienteController {

    constructor(pacienteService) {
        this.pacienteService = pacienteService;
    }

    crearPaciente = async (req, res) => {

        try {
            const paciente = await this.pacienteService.crearPaciente(req.body);

            res.status(201).json({
                ok: true,
                paciente
            });
        } catch (error) {

            console.error(error);
            res.status(400).json({
                ok: false,
                mensaje: error.message
            });
        }
    };


    // Leer - todos
    obtenerPacientes = async (req, res) => {

        try {

            const { sucursalId } = req.params;

            const pacientes = await this.pacienteService.obtenerPacientes( sucursalId );

            res.status(200).json({
                ok: true,
                pacientes
            });

        } catch (error) {
            console.error(error);
            res.status(400).json({
                ok: false,
                mensaje: error.message
            });
        }
    };


    // READ - uno
    obtenerPacientePorId = async (req, res) => {

        try {
            const { id } = req.params;
            const paciente = await this.pacienteService.obtenerPacientePorId(id);

            res.status(200).json({
                ok: true,
                paciente
            });

        } catch (error) {

            console.error(error);
            res.status(404).json({
                ok: false,
                mensaje: error.message
            });
        }
    };


    // UPDATE
    actualizarPaciente = async (req, res) => {
        try {
            const { id } = req.params;
            const paciente =
                await this.pacienteService.actualizarPaciente( id, req.body);

            res.status(200).json({
                ok: true,
                paciente
            });

        } catch (error) {
            console.error(error);
            res.status(400).json({
                ok: false,
                mensaje: error.message
            });
        }
    };
}

module.exports = PacienteController;