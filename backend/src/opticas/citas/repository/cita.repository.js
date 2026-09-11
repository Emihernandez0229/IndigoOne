



class CitasRepository {


    constructor(pool){
        this.pool = pool
    }
    // Crear cita 
    async crearCita(
        sucursalId,
        clienteId,
        fechaHora,
        motivo,
        creadoPor

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

        const { rows } = await this.pool.query(query, values);
        
        return rows[0];
    }


    async obtenerTodasCitas(sucursalId) {
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
        const { rows } = await this.pool.query(query, [sucursalId]);
        return rows;

    }


    async obtenerCitaPorId(sucursalId, citaId){

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
        const { rows } = await this.pool.query(query, [citaId, sucursalId]);

        return rows[0];

    }

    async obtenerCitasPorCliente (clienteId, sucursalId){

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
            ORDER BY fecha_hora DESC
        `;

        const { rows } = await this.pool.query(query, [clienteId, sucursalId]);

        return rows;
    }


    async obtenerCitasPorDia(sucursalId, fecha){

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
            ORDER BY fecha_hora ASC
        `;

        const { rows } = await this.pool.query(query, [sucursalId, fecha]);

        return rows;
    } 


    async obtenerCitasPorEstado(sucursalId, estado) {
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
            ORDER BY fecha_hora ASC
        `;

        const { rows } = await this.pool.query(query, [sucursalId, estado]);
        
        return rows;
    }

    async actualizarCita(citaId, sucursalId, {fechaHora, motivo}) {
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

        const { rows } = await this.pool.query(query, [citaId, sucursalId, fechaHora, motivo]);
        return rows[0];
    }

    async actualizarEstadoCita(citaId, sucursalId, estado){

        const query = `
            UPDATE citas
            SET estado = $3
            WHERE id = $1
            AND sucursal_id = $2
            RETURNING
                id,
                estado;
        `;

        const { rows } = await this.pool.query(query, [citaId,sucursalId,estado]);

        return rows[0];

    }
}