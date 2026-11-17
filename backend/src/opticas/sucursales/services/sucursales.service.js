const {
    BadRequestError,
    NotFoundError,
    ConflictError,
} = require('../../../core/utils/errors');

class SucursalesService {
    constructor(sucursalRepository, transactionManager) {
        this.sucursalRepository = sucursalRepository;
        this.transactionManager = transactionManager;
    }

    _normalizarNombre(nombre) {
        return nombre.trim().replace(/\s+/g, ' ').toUpperCase();
    }

    async #obtenerSucursalDeOptica(sucursalId, opticaId, client) {
        const sucursal = await this.sucursalRepository.buscarPorId(sucursalId, client);

        if (!sucursal || String(sucursal.optica_id) !== String(opticaId)) {
            throw new NotFoundError('La sucursal no existe');
        }

        return sucursal;
    }

    async #validarCandidatoGerente(opticaUsuarioId, opticaId, client) {
        const candidato = await this.sucursalRepository.buscarUsuarioPorId(opticaUsuarioId, opticaId, client);

        if (!candidato) {
            throw new NotFoundError('El usuario no existe o no pertenece a esta óptica');
        }

        if (!candidato.activo) {
            throw new BadRequestError('El usuario seleccionado está inactivo');
        }

        if (candidato.rol !== 'encargado') {
            throw new BadRequestError('El usuario seleccionado no tiene el rol de encargado');
        }

        const asignacionExistente = await this.sucursalRepository.buscarSucursalGerente(opticaUsuarioId, client);

        if (asignacionExistente) {
            throw new ConflictError('El usuario ya está asignado como gerente de otra sucursal');
        }

        return candidato;
    }

    /**
     * Crea una nueva sucursal y opcionalmente asigna un gerente.
     *
     * Nota: nombre obligatorio, y la regla "no gerente + asignarme a la vez"
     * ya se validan en crearSucursalSchema (Zod), no se repiten aquí.
     *
     * @param {Object} data
     * @param {string} data.opticaId - Viene del token, no del body.
     * @param {string} data.nombre
     * @param {string} [data.direccion]
     * @param {string} [data.telefono]
     * @param {string} [data.gerente_optica_usuario_id]
     * @param {boolean} [data.asignarme]
     * @param {string} data.creadorId - Viene del token, no del body.
     * @returns {Promise<Object>} Sucursal creada.
     */
    async crearSucursal({ opticaId, nombre, direccion, telefono, gerente_optica_usuario_id, asignarme, creadorId }) {
        if (!opticaId || !creadorId) {
            throw new BadRequestError('La óptica y el creador son obligatorios');
        }

        const nombreSucursal = this._normalizarNombre(nombre);

        return await this.transactionManager.ejecutar(async (client) => {
            const sucursalExistente = await this.sucursalRepository.buscarPorNombre(nombreSucursal, opticaId, client);

            if (sucursalExistente) {
                throw new ConflictError('Ya existe una sucursal con ese nombre en esta óptica');
            }

            let gerenteId = null;

            if (gerente_optica_usuario_id) {
                await this.#validarCandidatoGerente(gerente_optica_usuario_id, opticaId, client);
                gerenteId = gerente_optica_usuario_id;
            }

            if (asignarme) {
                const creador = await this.sucursalRepository.buscarUsuarioPorId(creadorId, opticaId, client);

                if (!creador) {
                    throw new NotFoundError('El usuario creador no existe o no pertenece a esta óptica');
                }

                if (!creador.activo) {
                    throw new BadRequestError('El usuario creador está inactivo');
                }

                if (creador.rol !== 'dueno') {
                    throw new BadRequestError('El usuario creador no tiene el rol de dueño');
                }

                const asignacion = await this.sucursalRepository.buscarSucursalGerente(creadorId, client);

                if (asignacion) {
                    throw new ConflictError('El usuario creador ya está asignado como gerente de otra sucursal');
                }

                gerenteId = creadorId;
            }

            const sucursal = await this.sucursalRepository.crear({ opticaId, nombre: nombreSucursal, direccion, telefono }, client);

            let gerenteAsignado = null;

            if (gerenteId) {
                await this.sucursalRepository.asignarSucursalAUsuario(gerenteId, sucursal.id, client);
                gerenteAsignado = await this.sucursalRepository.asignarGerente(sucursal.id, gerenteId, client);
            }

            return { sucursal, gerente_asignado: gerenteAsignado };
        });
    }

    /**
     * Asigna un usuario encargado como gerente de una sucursal.
     *
     * @param {string} sucursalId - Validado como UUID en asignarGerenteSchema.
     * @param {string} opticaUsuarioId - Validado como UUID en asignarGerenteSchema.
     * @param {string} opticaId - Viene del token, no del body.
     * @returns {Promise<Object>}
     */
    async asignarGerente(sucursalId, opticaUsuarioId, opticaId) {
        if (!opticaId) {
            throw new BadRequestError('La óptica es obligatoria');
        }

        return await this.transactionManager.ejecutar(async (client) => {
            await this.#obtenerSucursalDeOptica(sucursalId, opticaId, client);
            await this.#validarCandidatoGerente(opticaUsuarioId, opticaId, client);

            const gerenteActual = await this.sucursalRepository.buscarGerentePorSucursal(sucursalId, client);

            if (gerenteActual) {
                throw new ConflictError('La sucursal ya tiene un gerente asignado');
            }

            await this.sucursalRepository.asignarSucursalAUsuario(opticaUsuarioId, sucursalId, client);

            return await this.sucursalRepository.asignarGerente(sucursalId, opticaUsuarioId, client);
        });
    }

    async listarGerentesDisponibles(opticaId) {
        if (!opticaId) {
            throw new BadRequestError('La óptica es obligatoria');
        }

        return await this.sucursalRepository.listarGerentesDisponibles(opticaId);
    }

    async listarSucursales(opticaId) {
        if (!opticaId) {
            throw new BadRequestError('La óptica es obligatoria');
        }

        return await this.sucursalRepository.listarSucursales(opticaId);
    }

    /**
     * @param {string} sucursalId - Validado como UUID en sucursalParamsSchema.
     * @param {string} opticaId - Viene del token.
     */
    async obtenerSucursal(sucursalId, opticaId) {
        if (!opticaId) {
            throw new BadRequestError('La óptica es obligatoria');
        }

        return await this.#obtenerSucursalDeOptica(sucursalId, opticaId);
    }

    /**
     * Actualiza los datos de una sucursal.
     *
     * Nota: formato/longitud de nombre, dirección y teléfono ya se
     * validan en actualizarSucursalSchema; aquí solo se revisa la
     * regla de negocio "nombre único por óptica" (depende de BD).
     *
     * @param {string} sucursalId
     * @param {string} opticaId - Viene del token.
     * @param {Object} data
     */
    async actualizarSucursal(sucursalId, opticaId, data) {
        if (!opticaId) {
            throw new BadRequestError('La óptica es obligatoria');
        }

        return await this.transactionManager.ejecutar(async (client) => {
            const sucursal = await this.#obtenerSucursalDeOptica(sucursalId, opticaId, client);

            const nombre = data.nombre ? this._normalizarNombre(data.nombre) : sucursal.nombre;

            if (nombre !== sucursal.nombre) {
                const sucursalExistente = await this.sucursalRepository.buscarPorNombre(nombre, opticaId, client);

                if (sucursalExistente && sucursalExistente.id !== sucursalId) {
                    throw new ConflictError('Ya existe una sucursal con ese nombre en esta óptica');
                }
            }

            const direccion = data.direccion !== undefined ? data.direccion : sucursal.direccion;
            const telefono = data.telefono !== undefined ? data.telefono : sucursal.telefono;

            return await this.sucursalRepository.actualizar(sucursalId, { nombre, direccion, telefono }, client);
        });
    }

    async desactivarSucursal(sucursalId, opticaId) {
        if (!opticaId) {
            throw new BadRequestError('La óptica es obligatoria');
        }

        return await this.transactionManager.ejecutar(async (client) => {
            const sucursal = await this.#obtenerSucursalDeOptica(sucursalId, opticaId, client);

            if (!sucursal.activo) {
                throw new ConflictError('La sucursal ya está desactivada');
            }

            return await this.sucursalRepository.desactivarSucursal(sucursalId, opticaId, client);
        });
    }

    async activarSucursal(sucursalId, opticaId) {
        if (!opticaId) {
            throw new BadRequestError('La óptica es obligatoria');
        }

        return await this.transactionManager.ejecutar(async (client) => {
            const sucursal = await this.#obtenerSucursalDeOptica(sucursalId, opticaId, client);

            if (sucursal.activo) {
                throw new ConflictError('La sucursal ya está activa');
            }

            return await this.sucursalRepository.activar(sucursalId, opticaId, client);
        });
    }

    /**
     * @param {string} sucursalId
     * @param {string} opticaUsuarioId - Validado como UUID en cambiarGerenteSchema.
     * @param {string} opticaId - Viene del token.
     */
    async cambiarGerente(sucursalId, opticaUsuarioId, opticaId) {
        if (!opticaId) {
            throw new BadRequestError('La óptica es obligatoria');
        }

        return await this.transactionManager.ejecutar(async (client) => {
            await this.#obtenerSucursalDeOptica(sucursalId, opticaId, client);

            const gerenteActual = await this.sucursalRepository.buscarGerentePorSucursal(sucursalId, client);

            if (!gerenteActual) {
                throw new ConflictError('La sucursal no tiene un gerente asignado');
            }

            if (gerenteActual.optica_usuario_id === opticaUsuarioId) {
                throw new ConflictError('El usuario ya es el gerente de esta sucursal');
            }

            await this.#validarCandidatoGerente(opticaUsuarioId, opticaId, client);

            await this.sucursalRepository.quitarSucursalAUsuario(gerenteActual.optica_usuario_id, client);
            await this.sucursalRepository.asignarSucursalAUsuario(opticaUsuarioId, sucursalId, client);

            return await this.sucursalRepository.cambiarGerente(sucursalId, opticaUsuarioId, client);
        });
    }
}

module.exports = SucursalesService;