class SucursalController {
    constructor(sucursalService) {
        this.sucursalService = sucursalService;
    }

    /**
     * Asigna un gerente a una sucursal.
     * @param {Object} req - Objeto de solicitud HTTP.
     * @param {Object} res - Objeto de respuesta HTTP.
     * @returns {Promise<Object>} Relación creada.
     */
    async asignarGerente(req, res) {
        const { sucursal_id, optica_usuario_id } = req.body;
        const { optica_id } = req.user;

        const gerente = await this.sucursalService.asignarGerente(
            sucursal_id,
            optica_usuario_id,
            optica_id
        );

        res.status(201).json({
            message: 'Gerente asignado correctamente',
            data: gerente
        });
    }
    /**
     * Crea una nueva sucursal.
     *
     * @param {Object} req - Objeto de solicitud HTTP.
     * @param {Object} res - Objeto de respuesta HTTP.
     * @returns {Promise<Object>} Sucursal creada.
     */
    async crearSucursal(req, res) {
        const { nombre, direccion, telefono, gerente_optica_usuario_id, asignarme } = req.body;

        const { optica_id, id: creadorId } = req.user;

        const sucursal = await this.sucursalService.crearSucursal({
            opticaId: optica_id,
            nombre,
            direccion,
            telefono,
            gerente_optica_usuario_id,
            asignarme,
            creadorId
        });

        res.status(201).json({
            message: 'Sucursal creada correctamente',
            data: sucursal
        });
    }

    /**
     * Obtiene los gerentes disponibles de una óptica.
     *
     * @param {Object} req - Objeto de solicitud HTTP.
     * @param {Object} res - Objeto de respuesta HTTP.
     * @returns {Promise<Object>} Lista de gerentes disponibles.
     */
    async listarGerentesDisponibles(req, res) {
        const { optica_id } = req.user;

        const gerentes = await this.sucursalService.listarGerentesDisponibles(
            optica_id
        );

        res.status(200).json({
            data: gerentes
        });
    }
    /**
     * Obtiene las sucursales de la óptica autenticada.
     *
     * @param {Object} req - Objeto de solicitud HTTP.
     * @param {Object} res - Objeto de respuesta HTTP.
     * @returns {Promise<Object>} Lista de sucursales.
     */
    async listarSucursales(req, res) {
        const { optica_id } = req.user;
    
        const sucursales =
            await this.sucursalService.listarSucursales(
                optica_id
            );
        
        res.status(200).json({
            data: sucursales
        });
    }

    /**
     * Obtiene una sucursal por su ID.
     *
     * @param {Object} req - Objeto de petición de Express.
     * @param {Object} res - Objeto de respuesta de Express.
     * @returns {Promise<Object>} Sucursal encontrada.
     */
    async obtenerSucursal(req, res) {
        const { id } = req.params;
        const { optica_id } = req.user;

        const sucursal = await this.sucursalService.obtenerSucursal(
            id,
            optica_id
        );

        return res.status(200).json({
            message: 'Sucursal obtenida correctamente',
            data: sucursal
        });
    }


    /**
     * Actualiza los datos de una sucursal.
     *
     * @param {Object} req - Objeto de petición de Express.
     * @param {Object} res - Objeto de respuesta de Express.
     * @returns {Promise<Object>} Sucursal actualizada.
     */
    async actualizarSucursal(req, res) {
        const { id } = req.params;
        const { optica_id } = req.user;

        const sucursal = await this.sucursalService.actualizarSucursal(
            id,
            optica_id,
            req.body
        );

        return res.status(200).json({
            message: 'Sucursal actualizada correctamente',
            data: sucursal
        });
    }


    async desactivarSucursal(req, res){
        const { id } = req.params;
        const { optica_id } = req.user;

        const sucursal = await this.sucursalService.desactivarSucursal(id, optica_id);

        return res.status(200).json({
            message:'Sucursal desactivada correctamente',
            data:sucursal
        })
    }

    async activarSucursal(req, res){

        const { id } = req.params;
        const { optica_id } = req.user;
        
        const sucursal = await this.sucursalService.activarSucursal(
            id,
            optica_id
        );

        return res.status(200).json({
            message:'Sucursal activada correctamente',
            data:sucursal
        });
    }

    /**
     * Cambia el gerente asignado a una sucursal.
     *
     * @param {Object} req - Objeto de petición de Express.
     * @param {Object} res - Objeto de respuesta de Express.
     * @returns {Promise<Object>} Nueva asignación de gerente.
    */
    async cambiarGerente(req, res) {
        const { id } = req.params;
        const { optica_id } = req.user;
        const { optica_usuario_id } = req.body;

        const gerente =
            await this.sucursalService.cambiarGerente(
                id,
                optica_usuario_id,
                optica_id
            );

        return res.status(200).json({
            message: 'Gerente cambiado correctamente',
            data: gerente
        });
    }

}

module.exports = SucursalController;