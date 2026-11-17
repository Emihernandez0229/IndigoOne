
const SELECT_PRODUCTO = `
    SELECT p.id, p.optica_id, p.nombre, p.sku, p.marca, p.descripcion,
           p.categoria_id, c.nombre AS categoria_nombre,
           p.precio_venta, p.stock_minimo, p.activo,
           p.creado_por, p.created_at, p.updated_at
`;

class ProductosRepository {
    constructor(pool) {
        this.pool = pool;
    }

    _exec(client) {
        return client || this.pool;
    }

    async crear({ opticaId, creadoPor, nombre, sku, marca, descripcion, categoriaId, precioVenta, stockMinimo }, client) {
        const query = `
            WITH n AS (
                INSERT INTO productos
                    (optica_id, nombre, sku, marca, descripcion, categoria_id,
                     precio_venta, stock_minimo, creado_por)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                RETURNING *
            )
            ${SELECT_PRODUCTO.replaceAll('p.', 'n.')}
            FROM n JOIN categorias_productos c ON c.id = n.categoria_id
        `;

        const { rows } = await this._exec(client).query(query, [
            opticaId, nombre, sku ?? null, marca ?? null, descripcion ?? null,
            categoriaId, precioVenta, stockMinimo ?? 0, creadoPor,
        ]);
        return rows[0] ?? null;
    }

    async listar({ opticaId, filtros = {}, limit, offset }, client) {
        const condiciones = ['p.optica_id = $1'];
        const valores = [opticaId];

        if (filtros.activo !== undefined) {
            valores.push(filtros.activo);
            condiciones.push(`p.activo = $${valores.length}`);
        }
        if (filtros.marca) {
            valores.push(filtros.marca);
            condiciones.push(`p.marca ILIKE $${valores.length}`);
        }
        if (filtros.categoriaId) {
            valores.push(filtros.categoriaId);
            condiciones.push(`p.categoria_id = $${valores.length}`);
        }
        if (filtros.busqueda) {
            const literal = filtros.busqueda.replace(/[\\%_]/g, '\\$&');
            valores.push(`%${literal}%`);
            const pos = valores.length;
            condiciones.push(`(p.nombre ILIKE $${pos} OR p.sku ILIKE $${pos})`);
        }

        valores.push(limit, offset);
        const posLimit = valores.length - 1;
        const posOffset = valores.length;

        const query = `
            SELECT p.id, p.optica_id, p.nombre, p.sku, p.marca, p.descripcion,
                   p.categoria_id, c.nombre AS categoria_nombre,
                   p.precio_venta, p.stock_minimo, p.activo,
                   p.created_at, p.updated_at,
                   COUNT(*) OVER() AS total_registros
            FROM productos p
            JOIN categorias_productos c ON c.id = p.categoria_id
            WHERE ${condiciones.join(' AND ')}
            ORDER BY p.nombre ASC, p.id ASC
            LIMIT $${posLimit} OFFSET $${posOffset}
        `;

        const { rows } = await this._exec(client).query(query, valores);

        const total = rows.length > 0 ? Number(rows[0].total_registros) : 0;
        const productos = rows.map(({ total_registros, ...producto }) => producto);

        return { productos, total };
    }

    async obtenerPorId(productoId, opticaId, client) {
        const query = `
            ${SELECT_PRODUCTO}
            FROM productos p
            JOIN categorias_productos c ON c.id = p.categoria_id
            WHERE p.id = $1 AND p.optica_id = $2
            LIMIT 1
        `;
        const { rows } = await this._exec(client).query(query, [productoId, opticaId]);
        return rows[0] ?? null;
    }

    async actualizarProducto(productoId, opticaId, cambios, client) {
        const mapaColumnas = {
            nombre: 'nombre',
            sku: 'sku',
            marca: 'marca',
            descripcion: 'descripcion',
            categoriaId: 'categoria_id',
            precioVenta: 'precio_venta',
            stockMinimo: 'stock_minimo',
        };

        const campos = [];
        const valores = [];

        for (const [clave, columna] of Object.entries(mapaColumnas)) {
            if (cambios[clave] !== undefined) {
                valores.push(cambios[clave]);
                campos.push(`${columna} = $${valores.length}`);
            }
        }
        campos.push('updated_at = now()');

        valores.push(productoId, opticaId);
        const posId = valores.length - 1;
        const posOptica = valores.length;

        const query = `
            WITH n AS (
                UPDATE productos
                SET ${campos.join(', ')}
                WHERE id = $${posId} AND optica_id = $${posOptica}
                RETURNING *
            )
            ${SELECT_PRODUCTO.replaceAll('p.', 'n.')}
            FROM n JOIN categorias_productos c ON c.id = n.categoria_id
        `;

        const { rows } = await this._exec(client).query(query, valores);
        return rows[0] ?? null;
    }

    async cambiarEstado(productoId, opticaId, activo, client) {
        const query = `
            WITH n AS (
                UPDATE productos
                SET activo = $1, updated_at = now()
                WHERE id = $2 AND optica_id = $3
                RETURNING *
            )
            ${SELECT_PRODUCTO.replaceAll('p.', 'n.')}
            FROM n JOIN categorias_productos c ON c.id = n.categoria_id
        `;
        const { rows } = await this._exec(client).query(query, [activo, productoId, opticaId]);
        return rows[0] ?? null;
    }

    async listarCategorias(client) {
        const { rows } = await this._exec(client).query(
            'SELECT id, nombre FROM categorias_productos ORDER BY nombre'
        );
        return rows;
    }
}

module.exports = ProductosRepository;