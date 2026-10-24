const COLUMNAS_STOCK = 'producto_id, sucursal_id, cantidad, updated_at';

class StockRepository {
    constructor(pool) {
        this.pool = pool;
    }

    _exec(client) {
        return client || this.pool;
    }

    async listar({ opticaId, sucursalId, filtros = {}, limit, offset }, client) {
        const condiciones = ['p.optica_id = $1'];
        const valores = [opticaId, sucursalId];

        if (filtros.busqueda) {
            const literal = filtros.busqueda.replace(/[\\%_]/g, '\\$&');
            valores.push(`%${literal}%`);
            const pos = valores.length;
            condiciones.push(`(p.nombre ILIKE $${pos} OR p.sku ILIKE $${pos})`);
        }
        if (filtros.bajoMinimo === true) {
            condiciones.push('COALESCE(s.cantidad, 0) <= p.stock_minimo');
        }

        valores.push(limit, offset);
        const posLimit = valores.length - 1;
        const posOffset = valores.length;

        const query = `
            SELECT p.id AS producto_id, p.nombre, p.sku, p.marca, p.activo,
                   p.categoria_id, c.nombre AS categoria_nombre,
                   p.precio_venta,
                   COALESCE(s.cantidad, 0) AS cantidad,
                   p.stock_minimo,
                   s.updated_at,
                   COUNT(*) OVER() AS total_registros
            FROM productos p
            JOIN categorias_productos c ON c.id = p.categoria_id
            LEFT JOIN stock s ON s.producto_id = p.id AND s.sucursal_id = $2
            WHERE ${condiciones.join(' AND ')}
            ORDER BY p.nombre ASC, p.id ASC
            LIMIT $${posLimit} OFFSET $${posOffset}
        `;

        const { rows } = await this._exec(client).query(query, valores);

        const total = rows.length > 0 ? Number(rows[0].total_registros) : 0;
        const items = rows.map(({ total_registros, ...item }) => item);

        return { items, total };
    }

    async asegurarFila(productoId, sucursalId, client) {
        await this._exec(client).query(
            `INSERT INTO stock (producto_id, sucursal_id)
             VALUES ($1, $2)
             ON CONFLICT (producto_id, sucursal_id) DO NOTHING`,
            [productoId, sucursalId]
        );
    }

    async bloquearFila(productoId, sucursalId, client) {
        const { rows } = await this._exec(client).query(
            `SELECT cantidad FROM stock
              WHERE producto_id = $1 AND sucursal_id = $2
              FOR UPDATE`,
            [productoId, sucursalId]
        );
        return rows[0];
    }

    async actualizar({ productoId, sucursalId, cantidad }, client) {
        const { rows } = await this._exec(client).query(
            `UPDATE stock SET cantidad = $3, updated_at = now()
              WHERE producto_id = $1 AND sucursal_id = $2
              RETURNING ${COLUMNAS_STOCK}`,
            [productoId, sucursalId, cantidad]
        );
        return rows[0] ?? null;
    }

    async registrarMovimiento(
        { productoId, sucursalId, tipo, cantidad, cantidadAnterior, cantidadNueva, motivo, realizadoPor },
        client
    ) {
        const { rows } = await this._exec(client).query(
            `INSERT INTO stock_movimientos
                (producto_id, sucursal_id, tipo, cantidad,
                 cantidad_anterior, cantidad_nueva, motivo, realizado_por)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, producto_id, sucursal_id, tipo, cantidad,
                       cantidad_anterior, cantidad_nueva, motivo,
                       realizado_por, created_at`,
            [productoId, sucursalId, tipo, cantidad, cantidadAnterior, cantidadNueva, motivo ?? null, realizadoPor]
        );
        return rows[0];
    }

    async listarMovimientos({ productoId, sucursalId, limit, offset }, client) {
        const { rows } = await this._exec(client).query(
            `SELECT
                m.id, m.tipo, m.cantidad, m.cantidad_anterior, m.cantidad_nueva,
                m.motivo, m.realizado_por, u.nombre AS realizado_por_nombre,
                m.created_at,
                COUNT(*) OVER() AS total_registros
             FROM stock_movimientos m
             JOIN optica_usuarios u ON u.id = m.realizado_por
             WHERE m.producto_id = $1 AND m.sucursal_id = $2
             ORDER BY m.created_at DESC, m.id ASC
             LIMIT $3 OFFSET $4`,
            [productoId, sucursalId, limit, offset]
        );

        const total = rows.length > 0 ? Number(rows[0].total_registros) : 0;
        const movimientos = rows.map(({ total_registros, ...m }) => m);

        return { movimientos, total };
    }
}

module.exports = StockRepository;