
const {
    BadRequestError,
    NotFoundError,
    ConflictError
} = require('../../../core/utils/errors');

class SucursalesService {
    constructor(sucursalRepository, transactionManager) {
        this.sucursalRepository = sucursalRepository;
        this.transactionManager = transactionManager;
    }


    /**
     * Normaliza el nombre de una sucursal. 
     * @param {string} nombre - Nombre original de la sucursal. 
     * @returns {string} Nombre normalizado. 
     */ 
    _normalizarNombre(nombre) { 
        return nombre
                    .trim()
                    .replace(/\s+/g, ' ')
                    .toUpperCase(); 
    }

    /**
     * Crea una nueva sucursal y opcionalmente asigna un gerente.
     *
     * @param {Object} data - Datos necesarios para crear la sucursal.
     * @param {string} data.opticaId - ID de la óptica.
     * @param {string} data.nombre - Nombre de la sucursal.
     * @param {string} [data.direccion] - Dirección de la sucursal.
     * @param {string} [data.telefono] - Teléfono de la sucursal.
     * @param {string} [data.gerente_optica_usuario_id] - ID del gerente a asignar.
     * @param {boolean} [data.asignarme] - Indica si el creador será el gerente.
     * @param {string} data.creadorId - ID del usuario que crea la sucursal.
     * @returns {Promise<Object>} Sucursal creada.
     */
    async crearSucursal({
        opticaId,
        nombre,
        direccion,
        telefono,
        gerente_optica_usuario_id,
        asignarme,
        creadorId
    }) {
        if (!opticaId || !creadorId) {
            throw new BadRequestError(
                'La óptica y el creador son obligatorios'
            );
        }

        if (!nombre || !nombre.trim()) {
            throw new BadRequestError(
                'El nombre de la sucursal es obligatorio'
            );
        }

        if (gerente_optica_usuario_id && asignarme) {
            throw new BadRequestError(
                'No puedes seleccionar un gerente y asignarte como gerente al mismo tiempo'
            );
        }
        const nombreSucursal = this._normalizarNombre(nombre);

        return await this.transactionManager.ejecutar(async (client) => {
            
            const sucursalExistente = await this.sucursalRepository.buscarPorNombre(
                    nombreSucursal,
                    opticaId,
                    client
                );
    
            if (sucursalExistente) {
                throw new ConflictError(
                    'Ya existe una sucursal con ese nombre en esta óptica'
                );
            }
    
    
            let gerenteId = null;
    
            if (gerente_optica_usuario_id) {
                const gerente = await this.sucursalRepository.buscarUsuarioPorId(
                        gerente_optica_usuario_id,
                        opticaId,
                        client
                    );
    
                if (!gerente) {
                    throw new NotFoundError(
                        'El usuario no existe o no pertenece a esta óptica'
                    );
                }
    
                if (!gerente.activo) {
                    throw new BadRequestError(
                        'El usuario seleccionado está inactivo'
                    );
                }
    
                if (gerente.rol !== 'encargado') {
                    throw new BadRequestError(
                        'El usuario seleccionado no tiene el rol de encargado'
                    );
                }
    
                const asignacion = await this.sucursalRepository.buscarSucursalGerente(
                        gerente_optica_usuario_id,
                        client
                    );
    
                if (asignacion) {
                    throw new ConflictError(
                        'El usuario ya está asignado como gerente de otra sucursal'
                    );
                }
    
                gerenteId = gerente_optica_usuario_id;
            }
    
            if (asignarme) {
                const creador = await this.sucursalRepository.buscarUsuarioPorId(
                        creadorId,
                        opticaId,
                        client
                    );
    
                if (!creador) {
                    throw new NotFoundError(
                        'El usuario creador no existe o no pertenece a esta óptica'
                    );
                }
    
                if (!creador.activo) {
                    throw new BadRequestError(
                        'El usuario creador está inactivo'
                    );
                }
    
                if (creador.rol !== 'dueno') {
                    throw new BadRequestError(
                        'El usuario creador no tiene el rol de encargado'
                    );
                }
    
                const asignacion = await this.sucursalRepository.buscarSucursalGerente(
                        creadorId,
                        client
                    );
    
                if (asignacion) {
                    throw new ConflictError(
                        'El usuario creador ya está asignado como gerente de otra sucursal'
                    );
                }
    
                gerenteId = creadorId;
            }
    
            const sucursal = await this.sucursalRepository.crear({
                    opticaId,
                    nombre: nombreSucursal,
                    direccion,
                    telefono,
                },
                client
            );
    
            let gerenteAsignado = null;
    
            if (gerenteId) {

                await this.sucursalRepository.asignarSucursalAUsuario(
                    gerenteId,
                    sucursal.id,
                    client
                );
                gerenteAsignado = await this.sucursalRepository.asignarGerente(
                        sucursal.id,
                        gerenteId,
                        client
                    );
            }
            return {
                sucursal,
                gerente_asignado:gerenteAsignado
            };

        })
    }


    /**
     * Asigna un usuario encargado como gerente de una sucursal.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {string} opticaUsuarioId - ID del usuario encargado.
     * @param {string} opticaId - ID de la óptica.
     * @returns {Promise<Object>} Relación creada entre sucursal y gerente.
     */
    async asignarGerente(sucursalId, opticaUsuarioId, opticaId) {
        if (!sucursalId || !opticaUsuarioId || !opticaId) {
            throw new BadRequestError(
                'La sucursal, el gerente y la óptica son obligatorios'
            );
        }

        return await this.transactionManager.ejecutar(async (client) => {
            const sucursal = await this.sucursalRepository.buscarPorId(
                sucursalId,
                client
            );

            if (!sucursal) {
                throw new NotFoundError(
                    'La sucursal no existe'
                );
            }

            if (sucursal.optica_id !== opticaId) {
                throw new NotFoundError(
                    'La sucursal no existe'
                );
            }

            const gerente = await this.sucursalRepository.buscarUsuarioPorId(
                opticaUsuarioId,
                opticaId,
                client
            );

            if (!gerente) {
                throw new NotFoundError(
                    'El usuario no existe o no pertenece a esta óptica'
                );
            }

            if (!gerente.activo) {
                throw new BadRequestError(
                    'El usuario seleccionado está inactivo'
                );
            }

            if (gerente.rol !== 'encargado') {
                throw new BadRequestError(
                    'El usuario seleccionado no tiene el rol de encargado'
                );
            }

            const gerenteSucursal = await this.sucursalRepository.buscarSucursalGerente(
                    opticaUsuarioId,
                    client
                );

            if (gerenteSucursal) {
                throw new ConflictError(
                    'El usuario ya está asignado como gerente de otra sucursal'
                );
            }

            const gerenteActual = await this.sucursalRepository.buscarGerentePorSucursal(
                    sucursalId,
                    client
                );

            if (gerenteActual) {
                throw new ConflictError(
                    'La sucursal ya tiene un gerente asignado'
                );
            }

            await this.sucursalRepository.asignarSucursalAUsuario(
                opticaUsuarioId,
                sucursalId,
                client
            );

            return await this.sucursalRepository.asignarGerente(
                sucursalId,
                opticaUsuarioId,
                client
            );
        });
    }

    /**
     * Obtiene los usuarios encargados disponibles para ser gerentes.
     *
     * @param {string} opticaId - ID de la óptica.
     * @returns {Promise<Array>} Lista de gerentes disponibles.
     */
    async listarGerentesDisponibles(opticaId) {
        if (!opticaId) {
            throw new BadRequestError(
                'La óptica es obligatoria'
            );
        }

        return await this.sucursalRepository.listarGerentesDisponibles(
            opticaId
        );
    }
    /**
     * Obtiene las sucursales de una óptica.
     *
     * @param {string} opticaId - ID de la óptica.
     * @returns {Promise<Array>} Lista de sucursales.
     */
    async listarSucursales(opticaId) {
        if (!opticaId) {
            throw new BadRequestError(
                'La óptica es obligatoria'
            );
        }

        return await this.sucursalRepository.listarSucursales(
            opticaId
        );
    }


    /**
     * Obtiene una sucursal por su ID.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {string} opticaId - ID de la óptica.
     * @returns {Promise<Object>} Sucursal encontrada.
     */
    async obtenerSucursal(sucursalId, opticaId) {
        if (!sucursalId || !opticaId) {
            throw new BadRequestError(
                'La sucursal y la óptica son obligatorias'
            );
        }

        const sucursal = await this.sucursalRepository.buscarPorId(
            sucursalId
        );

        if (!sucursal) {
            throw new NotFoundError(
                'La sucursal no existe'
            );
        }

        if (sucursal.optica_id !== opticaId) {
            throw new NotFoundError(
                'La sucursal no existe'
            );
        }

        return sucursal;
    }

    /**
     * Actualiza los datos de una sucursal.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {string} opticaId - ID de la óptica.
     * @param {Object} data - Datos a actualizar.
     * @returns {Promise<Object>} Sucursal actualizada.
    */
    async actualizarSucursal(sucursalId, opticaId, data) {
        if (!sucursalId || !opticaId) {
            throw new BadRequestError(
                'La sucursal y la óptica son obligatorias'
            );
        }

        return await this.transactionManager.ejecutar(async (client) => {
            const sucursal =
                await this.sucursalRepository.buscarPorId(
                    sucursalId,
                    client
                );

            if (!sucursal) {
                throw new NotFoundError(
                    'La sucursal no existe'
                );
            }

            if (sucursal.optica_id !== opticaId) {
                throw new NotFoundError(
                    'La sucursal no existe'
                );
            }

            const nombre = data.nombre
                ? this._normalizarNombre(data.nombre)
                : sucursal.nombre;

            if (nombre !== sucursal.nombre) {
                const sucursalExistente =
                    await this.sucursalRepository.buscarPorNombre(
                        nombre,
                        opticaId,
                        client
                    );

                if (
                    sucursalExistente &&
                    sucursalExistente.id !== sucursalId
                ) {
                    throw new ConflictError(
                        'Ya existe una sucursal con ese nombre en esta óptica'
                    );
                }
            }

            const direccion =
                data.direccion !== undefined
                    ? data.direccion
                    : sucursal.direccion;

            const telefono =
                data.telefono !== undefined
                    ? data.telefono
                    : sucursal.telefono;

            return await this.sucursalRepository.actualizar(
                sucursalId,
                {
                    nombre,
                    direccion,
                    telefono
                },
                client
            );
        });
    }


    /**
     * 
     * @param {string} sucursalId - ID de la sucursal 
     * @param {*} opticaId - ID de la óptica
     * @returns {Promise<Object>} Sucursal desactivada
     */
    async desactivarSucursal(sucursalId, opticaId){

        if(!sucursalId || !opticaId){
            throw new BadRequestError('La sucursal y la óptica son obligatorias');
        }

        const sucursal = await this.sucursalRepository.buscarPorId(sucursalId);

        if(!sucursal){
            throw new NotFoundError('La sucursal no existe');
        }

        if(sucursal.optica_id !== opticaId){
            throw new NotFoundError('La sucursal no existe');
        }

        if(!sucursal.activo){
            throw new ConflictError('La sucursal ya esta desactivada');
        }

        const sucursalDesactivada = await this.sucursalRepository.desactivarSucursal(
            sucursalId,
            opticaId
        );

        return sucursalDesactivada;
    }

    /**
     * Activa una sucursal.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {string} opticaId - ID de la óptica.
     * @returns {Promise<Object>} Sucursal activada.
    */
    async activarSucursal(sucursalId, opticaId) {
        if (!sucursalId || !opticaId) {
            throw new BadRequestError(
                'La sucursal y la óptica son obligatorias'
            );
        }

        const sucursal = await this.sucursalRepository.buscarPorId(
            sucursalId
        );

        if (!sucursal) {
            throw new NotFoundError(
                'La sucursal no existe'
            );
        }

        if (sucursal.optica_id !== opticaId) {
            throw new NotFoundError(
                'La sucursal no existe'
            );
        }

        if (sucursal.activo) {
            throw new ConflictError(
                'La sucursal ya está activa'
            );
        }

        const sucursalActivada = await this.sucursalRepository.activar(
                sucursalId,
                opticaId
            );

        return sucursalActivada;
    }

    /**
     * Cambia el gerente asignado a una sucursal.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {string} opticaUsuarioId - ID del nuevo gerente.
     * @param {string} opticaId - ID de la óptica.
     * @returns {Promise<Object>} Nueva asignación de gerente.
    */
    async cambiarGerente( sucursalId, opticaUsuarioId, opticaId) {

        if (!sucursalId || !opticaUsuarioId || !opticaId) {
            throw new BadRequestError(
                'La sucursal, el gerente y la óptica son obligatorios'
            );
        }

        return await this.transactionManager.ejecutar(async (client) => {
            const sucursal =  await this.sucursalRepository.buscarPorId(
                    sucursalId,
                    client
                );

            if (!sucursal) {
                throw new NotFoundError(
                    'La sucursal no existe'
                );
            }

            if (sucursal.optica_id !== opticaId) {
                throw new NotFoundError(
                    'La sucursal no existe'
                );
            }

            const gerenteActual = await this.sucursalRepository.buscarGerentePorSucursal(
                    sucursalId,
                    client
                );

            if (!gerenteActual) {
                throw new ConflictError(
                    'La sucursal no tiene un gerente asignado'
                );
            }

            if ( gerenteActual.optica_usuario_id === opticaUsuarioId) {
                throw new ConflictError(
                    'El usuario ya es el gerente de esta sucursal'
                );
            }

            const nuevoGerente = await this.sucursalRepository.buscarUsuarioPorId(
                    opticaUsuarioId,
                    opticaId,
                    client
                );

            if (!nuevoGerente) {
                throw new NotFoundError(
                    'El usuario no existe o no pertenece a esta óptica'
                );
            }

            if (!nuevoGerente.activo) {
                throw new BadRequestError(
                    'El usuario seleccionado está inactivo'
                );
            }

            if (nuevoGerente.rol !== 'encargado') {
                throw new BadRequestError(
                    'El usuario seleccionado no tiene el rol de encargado'
                );
            }

            const gerenteSucursal = await this.sucursalRepository.buscarSucursalGerente(
                    opticaUsuarioId,
                    client
                );

            if (gerenteSucursal) {
                throw new ConflictError(
                    'El usuario ya está asignado como gerente de otra sucursal'
                );
            }

            await this.sucursalRepository.quitarSucursalAUsuario(
                gerenteActual.optica_usuario_id,
                client
            );
            
            await this.sucursalRepository.asignarSucursalAUsuario(
                opticaUsuarioId,
                sucursalId,
                client
            );

            return await this.sucursalRepository.cambiarGerente(
                sucursalId,
                opticaUsuarioId,
                client
            );
        });
    }

}

module.exports = SucursalesService;