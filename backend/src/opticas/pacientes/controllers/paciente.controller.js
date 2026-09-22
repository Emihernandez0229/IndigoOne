class PacienteController {
    constructor(pacienteService) {
        this.pacienteService = pacienteService;
    }

    /**
     * Crea un nuevo paciente.
     * @param {Object} req - Objeto de solicitud HTTP.
     * @param {Object} res - Objeto de respuesta HTTP.
     * @returns {Promise<void>} Respuesta HTTP con el paciente creado.
     */
    async crearPaciente(req, res) {
        const paciente =
            await this.pacienteService.crearPaciente({
                usuario: req.user,
                ...req.body
            });

        res.status(201).json({
            ok: true,
            paciente
        });
    }

    /**
     * Obtiene los pacientes de una sucursal.
     * @param {Object} req - Objeto de solicitud HTTP.
     * @param {Object} res - Objeto de respuesta HTTP.
     * @returns {Promise<void>} Respuesta HTTP con los pacientes encontrados.
     */
    async obtenerPacientes(req, res) {
        const { sucursalId } = req.params;

        const pacientes =
            await this.pacienteService.obtenerPacientes({
                usuario: req.user,
                sucursalId
            });

        res.status(200).json({
            ok: true,
            pacientes
        });
    }

    /**
     * Obtiene un paciente por su identificador.
     * @param {Object} req - Objeto de solicitud HTTP.
     * @param {Object} res - Objeto de respuesta HTTP.
     * @returns {Promise<void>} Respuesta HTTP con el paciente encontrado.
     */
    async obtenerPacientePorId(req, res) {
        const { id } = req.params;

        const paciente =
            await this.pacienteService.obtenerPacientePorId({
                id,
                usuario: req.user
            });

        res.status(200).json({
            ok: true,
            paciente
        });
    }

    /**
     * Actualiza los datos de un paciente.
     * @param {Object} req - Objeto de solicitud HTTP.
     * @param {Object} res - Objeto de respuesta HTTP.
     * @returns {Promise<void>} Respuesta HTTP con el paciente actualizado.
     */
    async actualizarPaciente(req, res) {
        const { id } = req.params;

        const paciente =
            await this.pacienteService.actualizarPaciente({
                id,
                usuario: req.user,
                cambios: req.body
            });

        res.status(200).json({
            ok: true,
            paciente
        });
    }
}

module.exports = PacienteController;