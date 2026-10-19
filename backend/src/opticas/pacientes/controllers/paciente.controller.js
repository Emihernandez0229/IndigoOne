class PacienteController {
    constructor(pacienteService) {
        this.pacienteService = pacienteService;
    }

    /**
     * Crea un nuevo paciente.
     * @param {Object} req
     * @param {Object} res
     * @returns {Promise<void>}
     */
    async crearPaciente(req, res) {
        const paciente = await this.pacienteService.crearPaciente({
            usuario: req.user,
            ...req.body,
        });

        res.status(201).json({ success: true, data: paciente });
    }

    /**
     * Obtiene los pacientes de una sucursal.
     * @param {Object} req
     * @param {Object} res
     * @returns {Promise<void>}
     */
    async obtenerPacientes(req, res) {
        const { sucursalId } = req.params;

        const pacientes = await this.pacienteService.obtenerPacientes({
            usuario: req.user,
            sucursalId,
        });

        res.status(200).json({ success: true, data: pacientes });
    }

    /**
     * Obtiene un paciente por su identificador.
     * @param {Object} req
     * @param {Object} res
     * @returns {Promise<void>}
     */
    async obtenerPacientePorId(req, res) {
        const { id } = req.params;

        const paciente = await this.pacienteService.obtenerPacientePorId({
            id,
            usuario: req.user,
        });

        res.status(200).json({ success: true, data: paciente });
    }

    /**
     * Actualiza los datos de un paciente.
     * @param {Object} req
     * @param {Object} res
     * @returns {Promise<void>}
     */
    async actualizarPaciente(req, res) {
        const { id } = req.params;

        const paciente = await this.pacienteService.actualizarPaciente({
            id,
            usuario: req.user,
            cambios: req.body,
        });

        res.status(200).json({ success: true, data: paciente });
    }
}

module.exports = PacienteController;