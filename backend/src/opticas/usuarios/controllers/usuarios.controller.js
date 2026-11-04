class UsuariosController {

    constructor(usuariosService) {
        this.usuariosService = usuariosService;
    }

    /**
     * Crea un gerente (encargado) en la óptica del usuario autenticado.
     *
     * @param {Object} req - Solicitud HTTP.
     * @param {Object} res - Respuesta HTTP.
     * @returns {Promise<Object>} Respuesta con el gerente creado.
     */
    async crearGerente(req, res) {
        const { nombre, telefono, email } = req.body;

        const resultado = await this.usuariosService.crearGerente({
            opticaId: req.user.optica_id,
            nombre,
            telefono,
            email,
            creadoPorId: req.user.id
        });

        return res.status(201).json({
            message: 'Gerente creado con éxito',
            data: resultado
        });
    }

    /**
     * Crea un empleado en una sucursal de la óptica.
     *
     * @param {Object} req - Solicitud HTTP.
     * @param {Object} res - Respuesta HTTP.
     * @returns {Promise<Object>} Respuesta con el empleado creado.
     */
    async crearEmpleado(req, res) {
        const { nombre, telefono, email, sucursal_id } = req.body;

        const resultado = await this.usuariosService.crearEmpleado({
            opticaId: req.user.optica_id,
            sucursalId: sucursal_id,
            nombre,
            telefono,
            email,
            creador: { id: req.user.id, rol: req.user.rol }
        });

        return res.status(201).json({
            message: 'Empleado creado con éxito',
            data: resultado
        });
    }

    /**
     * Obtiene los usuarios disponibles para el usuario autenticado.
     *
     * @param {Object} req - Solicitud HTTP.
     * @param {Object} res - Respuesta HTTP.
     * @returns {Promise<Object>} Respuesta con los usuarios.
     */
    async listarUsuarios(req, res) {
        const resultado = await this.usuariosService.listarUsuarios({
            id: req.user.id,
            optica_id: req.user.optica_id,
            rol: req.user.rol
        });

        return res.status(200).json({
            data: resultado
        });
    }

    /**
     * Obtiene un usuario por su ID.
     *
     * @param {Object} req - Solicitud HTTP.
     * @param {Object} res - Respuesta HTTP.
     * @returns {Promise<Object>} Respuesta con el usuario encontrado.
     */
    async buscarUsuarioPorId(req, res) {
        const resultado = await this.usuariosService.buscarUsuarioPorId({
            usuarioId: req.params.id,
            id: req.user.id,
            optica_id: req.user.optica_id,
            rol: req.user.rol
        });

        return res.status(200).json({
            data: resultado
        });
    }

    /**
     * Actualiza un usuario (nombre, teléfono, email o estado activo).
     *
     * @param {Object} req - Solicitud HTTP.
     * @param {Object} res - Respuesta HTTP.
     * @returns {Promise<Object>} Respuesta con el usuario actualizado.
     */
    async actualizarUsuario(req, res) {
        const resultado = await this.usuariosService.actualizarUsuario({
            usuarioId: req.params.id,
            id: req.user.id,
            optica_id: req.user.optica_id,
            rol: req.user.rol,
            cambios: req.body
        });

        return res.status(200).json({
            message: 'Usuario actualizado correctamente',
            data: resultado
        });
    }
}

module.exports = UsuariosController;