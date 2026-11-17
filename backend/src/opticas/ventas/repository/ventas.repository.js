class VentasRepository {
    constructor(pool) {
        this.pool = pool;
    }

    _exec(client) {
        return client || this.pool;
    }

    async obtenerProductosParaVenta(ids, opticaId, sucursalId, client) {
        const { rows } = await this._exec(client).query(
            `SELECT p.id, p.nombre, p.sku, p.precio_venta, p.activo,
                    COALESCE(s.cantidad, 0) AS existencias
               FROM productos p
               LEFT JOIN stock s ON s.producto_id = p.id AND s.sucursal_id = $3
              WHERE p.id = ANY($1::uuid[]) AND p.optica_id = $2`,
            [ids, opticaId, sucursalId]
        );
        return rows;
    }

    async obtenerServiciosParaVenta(ids, opticaId, client) {
        const { rows } = await this._exec(client).query(
            `SELECT id, nombre, codigo, precio, activo
               FROM servicios WHERE id = ANY($1::uuid[]) AND optica_id = $2`,
            [ids, opticaId]
        );
        return rows;
    }

    async crearVenta(d, client) {
        const { rows } = await this._exec(client).query(
            `INSERT INTO ventas
                (folio, sucursal_id, cliente_final_id, vendedor_id, tipo_trabajo, prioridad,
                 metodo_pago, tasa_iva, subtotal, iva, total, monto_pagado,
                 estado, completada_at, pagada_at)
             VALUES
                ('VEN-' || lpad(nextval('seq_folio_venta')::text, 6, '0'),
                 $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
                 CASE WHEN $12::varchar = 'completada'::varchar THEN now() END,
                 CASE WHEN $13 THEN now() END)
             RETURNING id, folio`,
            [d.sucursalId, d.clienteId, d.vendedorId, d.tipoTrabajo, d.prioridad, d.metodoPago,
             d.tasaIva, d.subtotal, d.iva, d.total, d.montoPagado, d.estadoInicial, d.liquidada]
        );
        return rows[0];
    }

    async crearDetalle(ventaId, lineas, client) {
        const valores = [];
        const filas = lineas.map((l, i) => {
            const b = i * 8;
            valores.push(ventaId, l.productoId, l.servicioId, l.codigo ?? null,
                         l.descripcion, l.cantidad, l.precioUnitario, l.subtotal);
            return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8})`;
        });
        await this._exec(client).query(
            `INSERT INTO venta_detalle
                (venta_id, producto_id, servicio_id, codigo, descripcion, cantidad, precio_unitario, subtotal)
             VALUES ${filas.join(', ')}`,
            valores
        );
    }

    /** Venta con items, con los nombres de campo que espera el frontend. */
    async obtenerDetalle(ventaId, client) {
        const exec = this._exec(client);

        const { rows } = await exec.query(
            `SELECT v.id, v.folio, v.sucursal_id,
                    v.cliente_final_id AS paciente_id, cf.nombre AS paciente_nombre,
                    v.vendedor_id AS creado_por, u.nombre AS vendedor_nombre,
                    v.tipo_trabajo, v.prioridad, v.metodo_pago, v.tasa_iva,
                    v.subtotal, v.iva, v.total, v.monto_pagado,
                    v.total - v.monto_pagado AS saldo_pendiente,
                    v.estado, v.created_at, v.en_proceso_at, v.completada_at,
                    v.cancelada_at, v.pagada_at
               FROM ventas v
               LEFT JOIN clientes_finales cf ON cf.id = v.cliente_final_id
               JOIN optica_usuarios u ON u.id = v.vendedor_id
              WHERE v.id = $1`,
            [ventaId]
        );
        if (!rows[0]) return null;

        const { rows: items } = await exec.query(
            `SELECT COALESCE(producto_id, servicio_id) AS producto_id,
                    CASE WHEN producto_id IS NOT NULL THEN 'producto' ELSE 'servicio' END AS item_type,
                    codigo, descripcion AS modelo, cantidad, precio_unitario, subtotal
               FROM venta_detalle WHERE venta_id = $1 ORDER BY descripcion`,
            [ventaId]
        );

        return { ...rows[0], items };
    }

    async listar({ sucursalId, filtros = {}, limit, offset }, client) {
        const condiciones = ['v.sucursal_id = $1'];
        const valores = [sucursalId];
        const agregar = (sql, valor) => { valores.push(valor); condiciones.push(sql.replace('?', `$${valores.length}`)); };

        if (filtros.clienteId)   agregar('v.cliente_final_id = ?', filtros.clienteId);
        if (filtros.estado)      agregar('v.estado = ?', filtros.estado);
        if (filtros.tipoTrabajo) agregar('v.tipo_trabajo = ?', filtros.tipoTrabajo);
        if (filtros.desde)       agregar('v.created_at >= ?', filtros.desde);
        if (filtros.hasta)       agregar('v.created_at < ?', filtros.hasta);
        if (filtros.busqueda) {
            agregar('v.folio ILIKE ?', `%${filtros.busqueda.replace(/[\\%_]/g, '\\$&')}%`);
        }

        valores.push(limit, offset);
        const posLimit = valores.length - 1;
        const posOffset = valores.length;

        const { rows } = await this._exec(client).query(
            `SELECT v.id, v.folio, v.sucursal_id,
                    v.cliente_final_id AS paciente_id, cf.nombre AS paciente_nombre,
                    v.vendedor_id AS creado_por, u.nombre AS vendedor_nombre,
                    v.tipo_trabajo, v.prioridad, v.metodo_pago,
                    v.subtotal, v.iva, v.total, v.monto_pagado,
                    v.total - v.monto_pagado AS saldo_pendiente,
                    v.estado, v.created_at, v.en_proceso_at, v.completada_at,
                    v.cancelada_at, v.pagada_at,
                    COUNT(*) OVER() AS total_registros
               FROM ventas v
               LEFT JOIN clientes_finales cf ON cf.id = v.cliente_final_id
               JOIN optica_usuarios u ON u.id = v.vendedor_id
              WHERE ${condiciones.join(' AND ')}
              ORDER BY v.created_at DESC, v.id ASC
              LIMIT $${posLimit} OFFSET $${posOffset}`,
            valores
        );

        const total = rows.length > 0 ? Number(rows[0].total_registros) : 0;
        return { ventas: rows.map(({ total_registros, ...v }) => v), total };
    }

    async obtenerAlcance(ventaId, client) {
        const { rows } = await this._exec(client).query(
            `SELECT v.id, v.sucursal_id, s.optica_id
               FROM ventas v JOIN sucursales s ON s.id = v.sucursal_id
              WHERE v.id = $1`,
            [ventaId]
        );
        return rows[0] ?? null;
    }

    async bloquearVenta(ventaId, client) {
        const { rows } = await this._exec(client).query(
            `SELECT v.id, v.folio, v.sucursal_id, s.optica_id, v.tipo_trabajo,
                    v.estado, v.total, v.monto_pagado
               FROM ventas v JOIN sucursales s ON s.id = v.sucursal_id
              WHERE v.id = $1
              FOR UPDATE OF v`,
            [ventaId]
        );
        return rows[0] ?? null;
    }

    async registrarPago({ ventaId, nuevoMontoPagado, liquidada }, client) {
        await this._exec(client).query(
            `UPDATE ventas
                SET monto_pagado = $2,
                    pagada_at = CASE WHEN $3 THEN now() ELSE pagada_at END
              WHERE id = $1`,
            [ventaId, nuevoMontoPagado, liquidada]
        );
    }

    async actualizarEstado(ventaId, estado, client) {
        await this._exec(client).query(
            `UPDATE ventas
                SET estado = $2::varchar,
                    en_proceso_at = CASE WHEN $2::varchar = 'en_proceso' THEN now() ELSE en_proceso_at END,
                    completada_at = CASE WHEN $2::varchar = 'completada' THEN now() ELSE completada_at END
              WHERE id = $1`,
            [ventaId, estado]
        );
    }

    async obtenerProductosVendidos(ventaId, client) {
        const { rows } = await this._exec(client).query(
            `SELECT producto_id, cantidad FROM venta_detalle
              WHERE venta_id = $1 AND producto_id IS NOT NULL
              ORDER BY producto_id`,
            [ventaId]
        );
        return rows;
    }

    async marcarCancelada(ventaId, client) {
        await this._exec(client).query(
            `UPDATE ventas SET estado = 'cancelada', cancelada_at = now() WHERE id = $1`,
            [ventaId]
        );
    }
}

module.exports = VentasRepository;