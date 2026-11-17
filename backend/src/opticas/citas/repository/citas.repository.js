
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


    async existeCitaActiva({ sucursalId, fechaHora, estados, excluirCitaId = null }, client) {
        const condiciones = ['sucursal_id = $1', 'fecha_hora = $2', 'estado = ANY($3::text[])'];
        const valores = [sucursalId, fechaHora, estados];
        
        if (excluirCitaId) {
            valores.push(excluirCitaId);
            condiciones.push(`id != $${valores.length}`);
        }
    
        const query = `
            SELECT 1
            FROM citas
            WHERE ${condiciones.join(' AND ')}
            LIMIT 1
        `;
    
        const { rows } = await this._exec(client).query(query, valores);
        return rows.length > 0;
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

    async listarPorSucursal({ sucursalId, filtros = {}, limit, offset }, client) {

        const condiciones = ['c.sucursal_id = $1'];
        const valores = [sucursalId]; // faltaba esta declaración

        if (filtros.estados?.length) {
            valores.push(filtros.estados);
            condiciones.push(`c.estado = ANY($${valores.length}::text[])`);
        }

        if (filtros.desde) {
            valores.push(filtros.desde); // antes empujaba filtros.hasta por error
            condiciones.push(`c.fecha_hora >= $${valores.length}`);
        }

        if (filtros.hasta) {
            valores.push(filtros.hasta); // este bloque faltaba
            condiciones.push(`c.fecha_hora < $${valores.length}`);
        }

        if(filtros.clienteId){
            valores.push(filtros.clienteId);
            condiciones.push(`c.cliente_final_id = $${valores.length}`);
        }


        valores.push(limit, offset);
        const posLimit = valores.length - 1;
        const posOffset = valores.length;

        const query = `
            SELECT 
            c.id,
            c.sucursal_id,
            cf.nombre AS cliente_nombre,
            c.fecha_hora,
            c.motivo,
            c.estado,
            c.creado_por,
            c.created_at,
            COUNT(*) OVER() AS total_registros
            FROM citas c
            JOIN clientes_finales cf ON cf.id = c.cliente_final_id
            WHERE ${condiciones.join(' AND ')}
            ORDER BY c.fecha_hora ASC, c.id ASC
            LIMIT $${posLimit} OFFSET $${posOffset}
        `;

        const { rows } = await this._exec(client).query(query, valores);

        const total = rows.length > 0 ? Number(rows[0].total_registros) : 0;
        const citas = rows.map(({ total_registros, ...cita }) => cita);

        return { citas, total };
    }

    /**
     * Obtiene una cita específica de una sucursal.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {string} citaId - ID de la cita.
     * @param {Object} [client] - Cliente de PostgreSQL opcional.
     * @returns {Promise<Object|undefined>} Cita encontrada.
     */
    async obtenerCitaPorId(citaId, client) {
        const query = `
            SELECT
                c.id,
                c.sucursal_id,
                s.optica_id,
                c.cliente_final_id,
                cf.nombre AS cliente_nombre,
                c.fecha_hora,
                c.motivo,
                c.estado,
                c.creado_por,
                c.created_at
            FROM citas c
            JOIN sucursales s ON s.id = c.sucursal_id
            JOIN clientes_finales cf ON cf.id = c.cliente_final_id
            WHERE c.id = $1
            LIMIT 1
        `;

        const { rows } = await this._exec(client).query(query, [citaId]);
        return rows[0] ?? null;
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





    async actualizar({ citaId, fechaHora, motivo }, client) {
        const campos = [];
        const valores = [];

        if (fechaHora !== undefined) {
            valores.push(fechaHora);
            campos.push(`fecha_hora = $${valores.length}`);
        }

        if (motivo !== undefined) {
            valores.push(motivo);
            campos.push(`motivo = $${valores.length}`);
        }

        valores.push(citaId);

        const query = `
            UPDATE citas
            SET ${campos.join(', ')}
            WHERE id = $${valores.length}
            RETURNING id, sucursal_id, cliente_final_id, fecha_hora, motivo, estado, creado_por, created_at
        `;

        const { rows } = await this._exec(client).query(query, valores);
        return rows[0] ?? null;
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
    async actualizarEstadoCita({citaId, estado}, client) {
        const query = `
            UPDATE citas
            SET estado = $1
            WHERE id = $2
            RETURNING id, sucursal_id, cliente_final_id, fecha_hora, motivo, estado, creado_por, created_at
        `;

        const { rows } = await this._exec(client).query(
            query,
            [estado , citaId]
        );

        return rows[0] ?? null;
    }



}

module.exports = CitasRepository;