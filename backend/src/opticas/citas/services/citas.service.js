const {
    BadRequestError,
    NotFoundError,
    ConflictError,
    ForbiddenError,
} = require('../../../core/utils/errors');

const { validarAccesoRecurso } = require('../../helpers/autorizacion.helper');

const ESTADO_CITA = Object.freeze({
    PROGRAMADA: 'programada',
    CONFIRMADA: 'confirmada',
    ATENDIDA: 'atendida',
    CANCELADA: 'cancelada',
    NO_ASISTIO: 'no_asistio',
});

const TRANSICIONES_VALIDAS = Object.freeze({
    programada: ['confirmada', 'cancelada', 'no_asistio'],
    confirmada: ['atendida', 'cancelada', 'no_asistio'],
    atendida: [],
    cancelada: [],
    no_asistio: [],
});

const ESTADOS_CITA_ACTIVOS = Object.freeze([
    ESTADO_CITA.PROGRAMADA,
    ESTADO_CITA.CONFIRMADA,
]);

const LIMITE_CITAS_DEFECTO = 20;
const LIMITE_CITAS_MAXIMO = 100;
const PG_UNIQUE_VIOLATION = '23505';

class CitasService {
    constructor(citasRepository, pacienteRepository, sucursalesRepository, transactionManager) {
        this.citasRepository = citasRepository;
        this.pacienteRepository = pacienteRepository;
        this.sucursalesRepository = sucursalesRepository;
        this.transactionManager = transactionManager;
    }

    
    // Helper privado (depende de this.sucursalesRepository,
    // por eso no se comparte en core/helpers)

    /**
     * Busca una sucursal y valida que exista, esté activa y pertenezca
     * a la óptica del usuario.
     *
     * @param {string} sucursalId
     * @param {string} opticaId
     * @param {Object} [opciones]
     * @param {boolean} [opciones.validarActiva=true]
     * @param {import('pg').PoolClient} [client]
     * @returns {Promise<Object>} La sucursal encontrada.
     * @throws {NotFoundError} Si no existe.
     * @throws {BadRequestError} Si no está activa (cuando se valida).
     * @throws {ForbiddenError} Si no pertenece a la óptica.
     */
    async #validarSucursal(sucursalId, opticaId, { validarActiva = true } = {}, client) {
        const sucursal = await this.sucursalesRepository.buscarPorId(sucursalId, client);

        if (!sucursal) {
            throw new NotFoundError('La sucursal no fue encontrada.');
        }

        if (validarActiva && !sucursal.activo) {
            throw new BadRequestError('La sucursal no está activa.');
        }

        if (String(sucursal.optica_id) !== String(opticaId)) {
            throw new ForbiddenError('La sucursal no pertenece a la óptica del usuario.');
        }

        return sucursal;
    }

    /**
     * Obtiene una cita por ID y valida que exista.
     * Centraliza la llamada al repositorio repetida en obtenerCitaPorId,
     * actualizarCita y actualizarEstadoCita.
     *
     * @param {string} citaId
     * @param {import('pg').PoolClient} [client]
     * @returns {Promise<Object>}
     * @throws {NotFoundError}
     */
    async #obtenerCitaOFallar(citaId, client) {
        const cita = await this.citasRepository.obtenerCitaPorId(citaId, client);

        if (!cita) {
            throw new NotFoundError('La cita no fue encontrada.');
        }

        return cita;
    }

    
    // Endpoints

    /**
     * Crea una nueva cita para un cliente.
     *
     * @param {Object} data
     * @param {string} data.sucursalId
     * @param {string} data.opticaId
     * @param {string} data.clienteId
     * @param {Date} data.fechaHora
     * @param {string} data.motivo
     * @param {string} data.creadoPor
     * @returns {Promise<Object>} Cita creada.
     * @throws {BadRequestError} Si la fecha no es válida/futura, o la sucursal no está activa.
     * @throws {NotFoundError} Si la sucursal o el cliente no existen.
     * @throws {ForbiddenError} Si la sucursal no pertenece a la óptica del usuario.
     * @throws {ConflictError} Si ya existe una cita en esa fecha y hora.
     */
    async crearCita({ sucursalId, opticaId, clienteId, fechaHora, motivo, creadoPor }) {
        if (!(fechaHora instanceof Date) || Number.isNaN(fechaHora.getTime())) {
            throw new BadRequestError('La fecha y hora de la cita no son válidas.');
        }

        if (fechaHora.getTime() <= Date.now()) {
            throw new BadRequestError('La fecha y hora de la cita deben ser futuras.');
        }

        return await this.transactionManager.ejecutar(async (client) => {
            await this.#validarSucursal(sucursalId, opticaId, { validarActiva: true }, client);

            const paciente = await this.pacienteRepository.obtenerPacientePorId(clienteId, sucursalId, client);

            if (!paciente) {
                throw new NotFoundError('El cliente no existe o no pertenece a la sucursal.');
            }

            const horarioOcupado = await this.citasRepository.existeCitaActiva({
                sucursalId,
                fechaHora,
                estados: ESTADOS_CITA_ACTIVOS,
            }, client);

            if (horarioOcupado) {
                throw new ConflictError('Ya existe una cita programada en esa fecha y hora.');
            }

            try {
                const cita = await this.citasRepository.crearCita(
                    sucursalId, clienteId, fechaHora, motivo, creadoPor, client
                );

                if (!cita) {
                    throw new InternalServerError('No fue posible crear la cita.');
                }

                return cita;
            } catch (error) {
                // Concurrencia: dos solicitudes pasaron la verificación previa,
                // pero el índice único garantiza que solo una se inserte.
                if (error.code === PG_UNIQUE_VIOLATION) {
                    throw new ConflictError('Ya existe una cita programada en esa fecha y hora.');
                }
                throw error;
            }
        });
    }

    /**
     * Lista las citas de una sucursal, sin importar su estado, con paginación.
     *
     * @param {Object} data
     * @param {string} data.sucursalId
     * @param {string} data.opticaId
     * @param {Object} [data.paginacion]
     * @param {number} [data.paginacion.limit=20]
     * @param {number} [data.paginacion.offset=0]
     * @param {Object} [data.filtros={}]
     * @param {string[]} [data.filtros.estados]
     * @param {string} [data.filtros.desde]
     * @param {string} [data.filtros.hasta]
     * @param {string} [data.filtros.clienteId]
     * @returns {Promise<{ data: Object[], paginacion: Object }>}
     * @throws {NotFoundError} Si la sucursal no existe.
     * @throws {ForbiddenError} Si la sucursal no pertenece a la óptica del usuario.
     */
    async listarCitasPorSucursal({ sucursalId, opticaId, paginacion = {}, filtros = {} }) {
        const limit = Math.min(paginacion.limit ?? LIMITE_CITAS_DEFECTO, LIMITE_CITAS_MAXIMO);
        const offset = paginacion.offset ?? 0;

        await this.#validarSucursal(sucursalId, opticaId, { validarActiva: false });

        const { citas, total } = await this.citasRepository.listarPorSucursal({
            sucursalId, filtros, limit, offset,
        });

        return {
            data: citas,
            paginacion: { total, limit, offset, hasMore: offset + citas.length < total },
        };
    }

    /**
     * Obtiene el detalle de una cita, validando acceso según el rol.
     *
     * @param {Object} data
     * @param {string} data.citaId
     * @param {string} data.opticaId
     * @param {string|null} data.sucursalId
     * @param {boolean} data.esDueno
     * @returns {Promise<Object>}
     * @throws {NotFoundError}
     * @throws {ForbiddenError}
     */
    async obtenerCitaPorId({ citaId, opticaId, sucursalId, esDueno }) {
        const cita = await this.#obtenerCitaOFallar(citaId);

        validarAccesoRecurso(cita, { opticaId, sucursalId, esDueno }, 'No tienes acceso a esta cita.');

        return cita;
    }

    /**
     * Actualiza la fecha/hora y/o el motivo de una cita.
     *
     * Reglas:
     * - No se puede editar una cita cancelada o completada.
     * - Si se cambia fechaHora, debe ser futura y no debe chocar con otra
     *   cita activa de la misma sucursal.
     *
     * @param {Object} data
     * @param {string} data.citaId
     * @param {string} data.opticaId
     * @param {string|null} data.sucursalId
     * @param {boolean} data.esDueno
     * @param {Date} [data.fechaHora]
     * @param {string} [data.motivo]
     * @returns {Promise<Object>}
     * @throws {NotFoundError}
     * @throws {ForbiddenError}
     * @throws {BadRequestError}
     * @throws {ConflictError}
     */
    async actualizarCita({ citaId, opticaId, sucursalId, esDueno, fechaHora, motivo }) {
        return await this.transactionManager.ejecutar(async (client) => {
            const cita = await this.#obtenerCitaOFallar(citaId, client);

            validarAccesoRecurso(cita, { opticaId, sucursalId, esDueno }, 'No tienes acceso a esta cita.');

            if (!ESTADOS_CITA_ACTIVOS.includes(cita.estado)) {
                throw new BadRequestError('No se puede modificar una cita cancelada, atendida o marcada como no asistida.');
            }

            if (fechaHora) {
                const horarioOcupado = await this.citasRepository.existeCitaActiva({
                    sucursalId: cita.sucursal_id,
                    fechaHora,
                    estados: ESTADOS_CITA_ACTIVOS,
                    excluirCitaId: citaId,
                }, client);

                if (horarioOcupado) {
                    throw new ConflictError('Ya existe una cita programada en esa fecha y hora.');
                }
            }
            try {
                return await this.citasRepository.actualizar({ citaId, fechaHora, motivo }, client);                
            } catch (error) {
                if (error.code === PG_UNIQUE_VIOLATION) {
                    throw new ConflictError('Ya existe una cita programada en esa fecha y hora.');
                }
                throw error;
            }
        });
    }

    /**
     * Actualiza el estado de una cita validando la transición permitida.
     *
     * @param {Object} data
     * @param {string} data.citaId
     * @param {string} data.opticaId
     * @param {string|null} data.sucursalId
     * @param {boolean} data.esDueno
     * @param {string} data.nuevoEstado
     * @returns {Promise<Object>}
     * @throws {NotFoundError}
     * @throws {ForbiddenError}
     * @throws {BadRequestError}
     */
    async actualizarEstadoCita({ citaId, opticaId, sucursalId, esDueno, nuevoEstado }) {
        return await this.transactionManager.ejecutar(async (client) => {
            const cita = await this.#obtenerCitaOFallar(citaId, client);

            validarAccesoRecurso(cita, { opticaId, sucursalId, esDueno }, 'No tienes acceso a esta cita.');

            if (cita.estado === nuevoEstado) {
                throw new BadRequestError(`La cita ya se encuentra en estado "${nuevoEstado}".`);
            }

            const transicionesPermitidas = TRANSICIONES_VALIDAS[cita.estado] ?? [];

            if (!transicionesPermitidas.includes(nuevoEstado)) {
                throw new BadRequestError(`No se puede cambiar de estado "${cita.estado}" a "${nuevoEstado}".`);
            }

            return await this.citasRepository.actualizarEstadoCita({ citaId, estado: nuevoEstado }, client);
        });
    }
}

module.exports = CitasService;