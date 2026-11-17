const COLUMNAS_SELECT = (a) => `
    ${a}.id, ${a}.optica_id, ${a}.nombre, ${a}.codigo, ${a}.descripcion,
    ${a}.categoria_id, c.nombre AS categoria_nombre,
    ${a}.precio, ${a}.activo, ${a}.creado_por, ${a}.created_at, ${a}.updated_at
`;

class ServiciosRepository {
    constructor(pool) {
        this.pool = pool;
    }

    _exec(client) {
        return client || this.pool;
    }

    async crear({ opticaId, creadoPor, nombre, codigo, descripcion, categoriaId, precio }, client) {
        const query = `
            WITH n AS (
                INSERT INTO servicios
                    (optica_id, nombre, codigo, descripcion, categoria_id, precio, creado_por)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            )
            SELECT ${COLUMNAS_SELECT('n')}
            FROM n
            JOIN categorias_servicios c ON c.id = n.categoria_id
        `;

        const { rows } = await this._exec(client).query(query, [
            opticaId, nombre, codigo ?? null, descripcion ?? null,
            categoriaId, precio, creadoPor,
        ]);

        return rows[0] ?? null;
    }

    async listar({ opticaId, filtros = {}, limit, offset }, client) {
        const condiciones = ['s.optica_id = $1'];
        const valores = [opticaId];

        if (filtros.activo !== undefined) {
            valores.push(filtros.activo);
            condiciones.push(`s.activo = $${valores.length}`);
        }

        if (filtros.categoriaId) {
            valores.push(filtros.categoriaId);
            condiciones.push(`s.categoria_id = $${valores.length}`);
        }

        if (filtros.busqueda) {
            const literal = filtros.busqueda.replace(/[\\%_]/g, '\\$&');
            valores.push(`%${literal}%`);
            const pos = valores.length;
            condiciones.push(`(s.nombre ILIKE $${pos} OR s.codigo ILIKE $${pos})`);
        }

        valores.push(limit, offset);
        const posLimit = valores.length - 1;
        const posOffset = valores.length;

        const query = `
            SELECT
                s.id, s.optica_id, s.nombre, s.codigo, s.descripcion,
                s.categoria_id, c.nombre AS categoria_nombre,
                s.precio, s.activo, s.created_at, s.updated_at,
                COUNT(*) OVER() AS total_registros
            FROM servicios s
            JOIN categorias_servicios c ON c.id = s.categoria_id
            WHERE ${condiciones.join(' AND ')}
            ORDER BY s.nombre ASC, s.id ASC
            LIMIT $${posLimit} OFFSET $${posOffset}
        `;

        const { rows } = await this._exec(client).query(query, valores);

        const total = rows.length > 0 ? Number(rows[0].total_registros) : 0;
        const servicios = rows.map(({ total_registros, ...servicio }) => servicio);

        return { servicios, total };
    }

    async obtenerPorId(servicioId, opticaId, client) {
        const query = `
            SELECT ${COLUMNAS_SELECT('s')}
            FROM servicios s
            JOIN categorias_servicios c ON c.id = s.categoria_id
            WHERE s.id = $1 AND s.optica_id = $2
            LIMIT 1
        `;

        const { rows } = await this._exec(client).query(query, [servicioId, opticaId]);
        return rows[0] ?? null;
    }

    async actualizar(servicioId, opticaId, cambios, client) {
        const mapaColumnas = {
            nombre: 'nombre',
            codigo: 'codigo',
            descripcion: 'descripcion',
            categoriaId: 'categoria_id',
            precio: 'precio',
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

        valores.push(servicioId, opticaId);
        const posId = valores.length - 1;
        const posOptica = valores.length;

        const query = `
            WITH n AS (
                UPDATE servicios
                SET ${campos.join(', ')}
                WHERE id = $${posId} AND optica_id = $${posOptica}
                RETURNING *
            )
            SELECT ${COLUMNAS_SELECT('n')}
            FROM n
            JOIN categorias_servicios c ON c.id = n.categoria_id
        `;

        const { rows } = await this._exec(client).query(query, valores);
        return rows[0] ?? null;
    }

    async cambiarEstado(servicioId, opticaId, activo, client) {
        const query = `
            WITH n AS (
                UPDATE servicios
                SET activo = $1, updated_at = now()
                WHERE id = $2 AND optica_id = $3
                RETURNING *
            )
            SELECT ${COLUMNAS_SELECT('n')}
            FROM n
            JOIN categorias_servicios c ON c.id = n.categoria_id
        `;

        const { rows } = await this._exec(client).query(query, [activo, servicioId, opticaId]);
        return rows[0] ?? null;
    }

    async listarCategorias(client) {
        const { rows } = await this._exec(client).query(
            'SELECT id, nombre FROM categorias_servicios ORDER BY nombre'
        );
        return rows;
    }
}

module.exports = ServiciosRepository;