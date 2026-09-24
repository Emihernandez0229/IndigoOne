
class CitasRepository {

    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Obtiene el cliente de PostgreSQL que ejecutará la consulta.
     *
     * @param {Object} client - Cliente de PostgreSQL opcional.
     * @returns {Object} Cliente de PostgreSQL o pool.
     */
    _exec(client) {
        return client || this.pool;
    }

    /**
     * Crea una nueva cita.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {string} clienteId - ID del cliente.
     * @param {Date} fechaHora - Fecha y hora de la cita.
     * @param {string} motivo - Motivo de la cita.
     * @param {string} creadoPor - ID del usuario que crea la cita.
     * @param {Object} [client] - Cliente de PostgreSQL opcional.
     * @returns {Promise<Object>} Cita creada.
     */
    async crearCita(
        sucursalId,
        clienteId,
        fechaHora,
        motivo,
        creadoPor,
        client
    ) {
        const query = `
            INSERT INTO citas (
                sucursal_id,
                cliente_final_id,
                fecha_hora,
                motivo,
                creado_por
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                sucursal_id,
                cliente_final_id,
                fecha_hora,
                motivo,
                creado_por;
        `;

        const values = [
            sucursalId,
            clienteId,
            fechaHora,
            motivo,
            creadoPor
        ];

        const { rows } = await this._exec(client).query(query, values);

        return rows[0];
    }

    /**
     * Obtiene todas las citas pertenecientes a una sucursal.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {Object} [client] - Cliente de PostgreSQL opcional.
     * @returns {Promise<Object[]>} Lista de citas.
     */
    async obtenerTodasCitas(sucursalId, client) {
        const query = `
            SELECT
                id,
                sucursal_id,
                cliente_final_id,
                fecha_hora,
                motivo,
                estado,
                creado_por,
                created_at
            FROM citas
            WHERE sucursal_id = $1
            ORDER BY fecha_hora ASC;
        `;

        const { rows } = await this._exec(client).query(query, [sucursalId]);

        return rows;
    }

    /**
     * Obtiene una cita específica de una sucursal.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {string} citaId - ID de la cita.
     * @param {Object} [client] - Cliente de PostgreSQL opcional.
     * @returns {Promise<Object|undefined>} Cita encontrada.
     */
    async obtenerCitaPorId(sucursalId, citaId, client) {
        const query = `
            SELECT
                id,
                sucursal_id,
                cliente_final_id,
                fecha_hora,
                motivo,
                estado,
                creado_por,
                created_at
            FROM citas
            WHERE id = $1
            AND sucursal_id = $2;
        `;

        const { rows } = await this._exec(client).query(
            query,
            [citaId, sucursalId]
        );

        return rows[0];
    }

    /**
     * Obtiene todas las citas de un cliente dentro de una sucursal.
     *
     * @param {string} clienteId - ID del cliente.
     * @param {string} sucursalId - ID de la sucursal.
     * @param {Object} [client] - Cliente de PostgreSQL opcional.
     * @returns {Promise<Object[]>} Lista de citas.
     */
    async obtenerCitasPorCliente(clienteId, sucursalId, client) {
        const query = `
            SELECT
                id,
                sucursal_id,
                cliente_final_id,
                fecha_hora,
                motivo,
                estado,
                creado_por,
                created_at
            FROM citas
            WHERE cliente_final_id = $1
            AND sucursal_id = $2
            ORDER BY fecha_hora DESC;
        `;

        const { rows } = await this._exec(client).query(
            query,
            [clienteId, sucursalId]
        );

        return rows;
    }

    /**
     * Obtiene las citas de una sucursal correspondientes a un día.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {Date|string} fecha - Fecha que se desea consultar.
     * @param {Object} [client] - Cliente de PostgreSQL opcional.
     * @returns {Promise<Object[]>} Lista de citas.
     */
    async obtenerCitasPorDia(sucursalId, fecha, client) {
        const query = `
            SELECT
                id,
                cliente_final_id,
                fecha_hora,
                motivo,
                estado,
                creado_por,
                created_at
            FROM citas
            WHERE sucursal_id = $1
            AND fecha_hora >= $2
            AND fecha_hora < $2 + INTERVAL '1 day'
            ORDER BY fecha_hora ASC;
        `;

        const { rows } = await this._exec(client).query(
            query,
            [sucursalId, fecha]
        );

        return rows;
    }

    /**
     * Obtiene las citas de una sucursal filtradas por estado.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {string} estado - Estado de las citas.
     * @param {Object} [client] - Cliente de PostgreSQL opcional.
     * @returns {Promise<Object[]>} Lista de citas.
     */
    async obtenerCitasPorEstado(sucursalId, estado, client) {
        const query = `
            SELECT
                id,
                cliente_final_id,
                fecha_hora,
                motivo,
                estado,
                creado_por,
                created_at
            FROM citas
            WHERE sucursal_id = $1
            AND estado = $2
            ORDER BY fecha_hora ASC;
        `;

        const { rows } = await this._exec(client).query(
            query,
            [sucursalId, estado]
        );

        return rows;
    }

    /**
     * Actualiza la fecha y/o motivo de una cita.
     *
     * @param {string} citaId - ID de la cita.
     * @param {string} sucursalId - ID de la sucursal.
     * @param {Object} data - Datos a actualizar.
     * @param {Date} [data.fechaHora] - Nueva fecha y hora.
     * @param {string} [data.motivo] - Nuevo motivo.
     * @param {Object} [client] - Cliente de PostgreSQL opcional.
     * @returns {Promise<Object|undefined>} Cita actualizada.
     */
    async actualizarCita(citaId, sucursalId, { fechaHora, motivo }, client) {
        const query = `
            UPDATE citas
            SET fecha_hora = COALESCE($3, fecha_hora),
                motivo = COALESCE($4, motivo)
            WHERE id = $1
            AND sucursal_id = $2
            RETURNING
                id,
                sucursal_id,
                cliente_final_id,
                fecha_hora,
                motivo,
                estado,
                creado_por;
        `;

        const { rows } = await this._exec(client).query(
            query,
            [citaId, sucursalId, fechaHora, motivo]
        );

        return rows[0];
    }

    /**
     * Actualiza el estado de una cita.
     *
     * @param {string} citaId - ID de la cita.
     * @param {string} sucursalId - ID de la sucursal.
     * @param {string} estado - Nuevo estado de la cita.
     * @param {Object} [client] - Cliente de PostgreSQL opcional.
     * @returns {Promise<Object|undefined>} Cita actualizada.
     */
    async actualizarEstadoCita(citaId, sucursalId, estado, client) {
        const query = `
            UPDATE citas
            SET estado = $3
            WHERE id = $1
            AND sucursal_id = $2
            RETURNING
                id,
                estado;
        `;

        const { rows } = await this._exec(client).query(
            query,
            [citaId, sucursalId, estado]
        );

        return rows[0];
    }
}

module.exports = CitasRepository;