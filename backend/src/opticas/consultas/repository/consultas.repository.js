

class ConsultaRepository {

    constructor(pool){
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
     * @param {Object} data
     * @param {string} data.sucursalId
     * @param {string} data.clienteId
     * @param {string} data.fechaExamen
     * @param {Object} data.od
     * @param {Object} data.oi
     * @param {number} [data.dip]
     * @param {string} [data.observaciones]
     * @param {string} data.registradoPor
     */
    async crearConsulta({ sucursalId, clienteId, fechaExamen, od, oi, dip, observaciones, registradoPor }, client) {
        const query = `
            INSERT INTO consultas (
                sucursal_id, cliente_final_id, fecha_examen,
                od_esfera, od_cilindro, od_eje, od_adicion,
                oi_esfera, oi_cilindro, oi_eje, oi_adicion,
                dip, observaciones, registrado_por
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;

        const { rows } = await this._exec(client).query(query, [
            sucursalId,
            clienteId,
            fechaExamen,
            od.esfera ?? null,
            od.cilindro ?? null,
            od.eje ?? null,
            od.adicion ?? null,
            oi.esfera ?? null,
            oi.cilindro ?? null,
            oi.eje ?? null,
            oi.adicion ?? null,
            dip ?? null,
            observaciones ?? null,
            registradoPor,
        ]);

        return rows[0] ?? null;
    }

    async listarPorSucursal({ sucursalId, filtros = {}, limit, offset }, client) {
        const condiciones = ['c.sucursal_id = $1'];
        const valores = [sucursalId];

        if (filtros.clienteId) {
            valores.push(filtros.clienteId);
            condiciones.push(`c.cliente_final_id = $${valores.length}`);
        }

        if (filtros.desde) {
            valores.push(filtros.desde);
            condiciones.push(`c.fecha_examen >= $${valores.length}`);
        }

        if (filtros.hasta) {
            valores.push(filtros.hasta);
            condiciones.push(`c.fecha_examen <= $${valores.length}`);
        }

        valores.push(limit, offset);
        const posLimit = valores.length - 1;
        const posOffset = valores.length;

        const query = `
            SELECT
                c.id,
                c.sucursal_id,
                c.cliente_final_id,
                cf.nombre AS cliente_nombre,
                c.fecha_examen,
                c.od_esfera, c.od_cilindro, c.od_eje, c.od_adicion,
                c.oi_esfera, c.oi_cilindro, c.oi_eje, c.oi_adicion,
                c.dip,
                c.observaciones,
                c.registrado_por,
                c.created_at,
                COUNT(*) OVER() AS total_registros
            FROM consultas c
            JOIN clientes_finales cf ON cf.id = c.cliente_final_id
            WHERE ${condiciones.join(' AND ')}
            ORDER BY c.fecha_examen DESC, c.id ASC
            LIMIT $${posLimit} OFFSET $${posOffset}
        `;

        const { rows } = await this._exec(client).query(query, valores);

        const total = rows.length > 0 ? Number(rows[0].total_registros) : 0;
        const consultas = rows.map(({ total_registros, ...consulta }) => consulta);

        return { consultas, total };
    }

    async obtenerPorId(consultaId, client) {
    const query = `
        SELECT
            c.id,
            c.sucursal_id,
            s.optica_id,
            c.cliente_final_id,
            cf.nombre AS cliente_nombre,
            c.fecha_examen,
            c.od_esfera, c.od_cilindro, c.od_eje, c.od_adicion,
            c.oi_esfera, c.oi_cilindro, c.oi_eje, c.oi_adicion,
            c.dip,
            c.observaciones,
            c.registrado_por,
            c.created_at
        FROM consultas c
        JOIN sucursales s ON s.id = c.sucursal_id
        JOIN clientes_finales cf ON cf.id = c.cliente_final_id
        WHERE c.id = $1
        LIMIT 1
    `;

    const { rows } = await this._exec(client).query(query, [consultaId]);
    return rows[0] ?? null;
}
}


module.exports = ConsultaRepository;