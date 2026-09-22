
const {
    BadRequestError,
    NotFoundError
} = require('../../../core/utils/errors');

class CitaService {

    constructor(citasRepository, transactionManager) {
        this.citasRepository = citasRepository;
        this.transactionManager = transactionManager;

    }

    /**
     * Crea una nueva cita para un cliente.
     *
     * @param {Object} data - Datos de la cita.
     * @param {string} data.sucursalId - ID de la sucursal donde se crea la cita.
     * @param {string} data.clienteId - ID del cliente que tendrá la cita.
     * @param {Date} data.fechaHora - Fecha y hora programada para la cita.
     * @param {string} data.motivo - Motivo de la cita.
     * @param {string} data.creadoPor - ID del usuario que crea la cita.
     * @returns {Promise<Object>} Cita creada.
     * @throws {BadRequestError} Si ya existe una cita para el cliente en la misma fecha y hora.
     */
    async crearCita({ sucursalId, clienteId, fechaHora, motivo, creadoPor }) {
        return await this.transactionManager.ejecutar(async(client) =>{
            const citasDelDia = await this.citasRepository.obtenerCitasPorDia(
                sucursalId,
                fechaHora.toISOString().split('T')[0]
            );
    
            const citaDuplicada = citasDelDia.some(cita => {
                const mismaHora = new Date(cita.fecha_hora).getTime() === fechaHora.getTime();
                const mismoCliente = String(cita.cliente_final_id) === String(clienteId);
    
                return mismaHora && mismoCliente;
            });
    
            if (citaDuplicada) throw new BadRequestError('El cliente ya tiene una cita programada para esa fecha y hora.');
    
            const cita = await this.citasRepository.crearCita(
                sucursalId,
                clienteId,
                fechaHora,
                motivo,
                creadoPor,
                client
            );
    
            if (!cita) throw new BadRequestError('No fue posible crear la cita.');
    
            return cita;
        })
    }







    async obtenerTodasCitas({ sucursalId }) {
        return await this.citasRepository.obtenerTodasCitas(sucursalId);
    }




    async obtenerCitaPorId({ sucursalId, citaId }) {
        const cita = await this.citasRepository.obtenerCitaPorId(
            sucursalId,
            citaId
        );

        if (!cita) throw new NotFoundError('La cita no fue encontrada.');

        return cita;
    }


    async obtenerCitasPorCliente({ clienteId, sucursalId }) {
        return await this.citasRepository.obtenerCitasPorCliente(
            clienteId,
            sucursalId
        );
    }

    /**
     * Obtiene las citas programadas para un día específico.
     *
     * @param {Object} data - Parámetros de consulta.
     * @param {string} data.sucursalId - ID de la sucursal.
     * @param {Date} data.fecha - Fecha que se desea consultar.
     * @returns {Promise<Object[]>} Lista de citas del día.
     */
    async obtenerCitasPorDia({ sucursalId, fecha }) {
        return await this.citasRepository.obtenerCitasPorDia(
            sucursalId,
            fecha
        );
    }

    /**
     * Obtiene las citas de una sucursal filtradas por estado.
     *
     * @param {Object} data - Parámetros de consulta.
     * @param {string} data.sucursalId - ID de la sucursal.
     * @param {string} data.estado - Estado por el cual se filtrarán las citas.
     * @returns {Promise<Object[]>} Lista de citas filtradas.
     */
    async obtenerCitasPorEstado({ sucursalId, estado }) {
        return await this.citasRepository.obtenerCitasPorEstado(
            sucursalId,
            estado
        );
    }

    /**
     * Actualiza la fecha, hora o motivo de una cita.
     *
     * @param {Object} data - Datos de actualización.
     * @param {string} data.citaId - ID de la cita.
     * @param {string} data.sucursalId - ID de la sucursal.
     * @param {Date} [data.fechaHora] - Nueva fecha y hora de la cita.
     * @param {string} [data.motivo] - Nuevo motivo de la cita.
     * @returns {Promise<Object>} Cita actualizada.
     * @throws {NotFoundError} Si la cita no existe.
     * @throws {BadRequestError} Si la cita no puede modificarse o existe un conflicto de horario.
     */
    async actualizarCita({ citaId, sucursalId, fechaHora, motivo }) {
        const cita = await this.citasRepository.obtenerCitaPorId(
            sucursalId,
            citaId
        );

        if (!cita) throw new NotFoundError('La cita no fue encontrada.');

        if (
            cita.estado === 'cancelada' ||
            cita.estado === 'atendida' ||
            cita.estado === 'no_asistio'
        ) {
            throw new BadRequestError(`No se puede modificar una cita con estado "${cita.estado}".`);
        }

        if (fechaHora !== undefined) {
            const citasDelDia = await this.citasRepository.obtenerCitasPorDia(
                sucursalId,
                fechaHora.toISOString().split('T')[0]
            );

            const conflicto = citasDelDia.some(citaExistente => {
                if (String(citaExistente.id) === String(citaId)) return false;

                const mismaHora = new Date(citaExistente.fecha_hora).getTime() === fechaHora.getTime();
                const mismoCliente = String(citaExistente.cliente_final_id) === String(cita.cliente_final_id);

                return mismaHora && mismoCliente;
            });

            if (conflicto) throw new BadRequestError('El cliente ya tiene otra cita programada para esa fecha y hora.');
        }

        const citaActualizada = await this.citasRepository.actualizarCita(
            citaId,
            sucursalId,
            {
                fechaHora,
                motivo
            }
        );

        if (!citaActualizada) throw new NotFoundError('No fue posible actualizar la cita.');

        return citaActualizada;
    }

    /**
     * Actualiza el estado de una cita validando la transición permitida.
     *
     * @param {Object} data - Datos para actualizar el estado.
     * @param {string} data.citaId - ID de la cita.
     * @param {string} data.sucursalId - ID de la sucursal.
     * @param {string} data.nuevoEstado - Nuevo estado de la cita.
     * @returns {Promise<Object>} Cita con el estado actualizado.
     * @throws {NotFoundError} Si la cita no existe.
     * @throws {BadRequestError} Si la transición no está permitida.
     */
    async actualizarEstadoCita({ citaId, sucursalId, nuevoEstado }) {
        const cita = await this.citasRepository.obtenerCitaPorId(
            sucursalId,
            citaId
        );

        if (!cita) throw new NotFoundError('La cita no fue encontrada.');

        if (cita.estado === nuevoEstado) {
            throw new BadRequestError(`La cita ya se encuentra en estado "${nuevoEstado}".`);
        }

        const transicionesPermitidas = {
            programada: [
                'confirmada',
                'cancelada',
                'no_asistio'
            ],
            confirmada: [
                'atendida',
                'cancelada',
                'no_asistio'
            ],
            atendida: [],
            cancelada: [],
            no_asistio: []
        };

        const estadosSiguientes = transicionesPermitidas[cita.estado];

        if (!estadosSiguientes.includes(nuevoEstado)) {
            throw new BadRequestError(`No se puede cambiar una cita de "${cita.estado}" a "${nuevoEstado}".`);
        }

        const citaActualizada = await this.citasRepository.actualizarEstadoCita(
            citaId,
            sucursalId,
            nuevoEstado
        );

        if (!citaActualizada) throw new NotFoundError('No fue posible actualizar el estado de la cita.');

        return citaActualizada;
    }
}

module.exports = CitaService;