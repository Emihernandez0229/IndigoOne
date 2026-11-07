const { resolverRango } = require('../helpers/rango');

// Lista fija: nada de esto viene del cliente
const AGRUPACIONES = Object.freeze({
    sucursal: {
        select: 's.nombre',
        group: 's.id, s.nombre',
        join: 'JOIN sucursales s ON s.id = v.sucursal_id',
        order: 'total DESC',
    },
    empleado: {
        select: 'u.nombre',
        group: 'u.id, u.nombre',
        join: 'JOIN optica_usuarios u ON u.id = v.vendedor_id',
        order: 'total DESC',
    },
    dia: {
        select: `((v.created_at AT TIME ZONE 'America/Mexico_City')::date)::text`,
        group: `(v.created_at AT TIME ZONE 'America/Mexico_City')::date`,
        join: '',
        order: 'etiqueta ASC',
    },
});

class ReportesRepository {
    constructor(pool) {
        this.pool = pool;
    }

    _exec(client) {
        return client || this.pool;
    }

    async idsSucursalesDeOptica(opticaId, client) {
        const { rows } = await this._exec(client).query(
            'SELECT id FROM sucursales WHERE optica_id = $1', [opticaId]
        );
        return rows.map((r) => r.id);
    }

    /** Condiciones comunes. Parámetros: $1 sucursales, $2 vendedor, luego el rango. */
    #base({ sucursalIds, vendedorId, desde, hasta, periodo }) {
        const rango = resolverRango({ desde, hasta, periodo }, 3);
        const valores = [sucursalIds, vendedorId, ...rango.valores];
        const where = [
            'v.sucursal_id = ANY($1::uuid[])',
            `v.estado <> 'cancelada'`,
            'v.monto_pagado = v.total',
            '($2::uuid IS NULL OR v.vendedor_id = $2::uuid)',
            `v.created_at >= ${rango.inicioSql}`,
            `v.created_at < ${rango.finSql}`,
        ];
        return { where, valores };
    }

    async ventasResumen(consulta, client) {
        const { where, valores } = this.#base(consulta);
        let join = '';

        if (consulta.productoId) {
            valores.push(consulta.productoId);
            join = `JOIN venta_detalle d ON d.venta_id = v.id AND d.producto_id = $${valores.length}`;
        } else if (consulta.servicioId) {
            valores.push(consulta.servicioId);
            join = `JOIN venta_detalle d ON d.venta_id = v.id AND d.servicio_id = $${valores.length}`;
        }

        // Con filtro de artículo se suma el subtotal de esa línea; sin él, el total de la venta
        const importe = join ? 'd.subtotal' : 'v.total';

        // Con filtro: cantidad del artículo filtrado (igual que ventasDesglose).
        // Sin filtro: unidades de productos por venta (los servicios no cuentan).
        const unidades = join
            ? `COALESCE(SUM(d.cantidad), 0)::int`
            : `COALESCE(SUM(du.unidades), 0)::int`;

        const lateral = join ? '' : `
            LEFT JOIN LATERAL (
                SELECT COALESCE(SUM(cantidad), 0) AS unidades
                  FROM venta_detalle
                 WHERE venta_id = v.id AND producto_id IS NOT NULL
            ) du ON TRUE`;

        const { rows } = await this._exec(client).query(
            `SELECT COALESCE(SUM(${importe}), 0)::numeric(12,2) AS total,
                    COUNT(DISTINCT v.id)::int AS operaciones,
                    COALESCE(ROUND(SUM(${importe}) / NULLIF(COUNT(DISTINCT v.id), 0), 2), 0)::numeric(12,2) AS ticket_promedio,
                    ${unidades} AS unidades
               FROM ventas v ${join} ${lateral}
              WHERE ${where.join(' AND ')}`,
            valores
        );
        return rows[0];
    }

    async ventasDesglose(consulta, client) {
        const { where, valores } = this.#base(consulta);
        const exec = this._exec(client);

        // Mismo criterio de artículo que ventasResumen
        let articulo = null;
        if (consulta.productoId) {
            valores.push(consulta.productoId);
            articulo = `d.producto_id = $${valores.length}`;
        } else if (consulta.servicioId) {
            valores.push(consulta.servicioId);
            articulo = `d.servicio_id = $${valores.length}`;
        }

        valores.push(consulta.limit ?? null);   // null = sin tope
        const posLimit = valores.length;

        const IMPORTE_ARTICULO = `COUNT(DISTINCT v.id)::int AS operaciones,
                    SUM(d.cantidad)::int AS unidades,
                    SUM(d.subtotal)::numeric(12,2) AS total,
                    ROUND(SUM(d.subtotal) / NULLIF(COUNT(DISTINCT v.id), 0), 2)::numeric(12,2) AS ticket_promedio`;

        // Por producto o servicio: se agrupa por línea de detalle
        if (consulta.agrupar === 'producto' || consulta.agrupar === 'servicio') {
            const col = consulta.agrupar === 'producto' ? 'd.producto_id' : 'd.servicio_id';
            const cond = [...where, `${col} IS NOT NULL`, ...(articulo ? [articulo] : [])];

            const { rows } = await exec.query(
                `SELECT ${col} AS id, MAX(d.descripcion) AS etiqueta, ${IMPORTE_ARTICULO}
                   FROM ventas v
                   JOIN venta_detalle d ON d.venta_id = v.id
                  WHERE ${cond.join(' AND ')}
                  GROUP BY ${col}
                  ORDER BY total DESC
                  LIMIT $${posLimit}`,
                valores
            );
            return rows;
        }

        const a = AGRUPACIONES[consulta.agrupar];

        // Con filtro de artículo: importe y unidades solo de esa línea
        if (articulo) {
            const { rows } = await exec.query(
                `SELECT ${a.select} AS etiqueta, ${IMPORTE_ARTICULO}
                   FROM ventas v ${a.join}
                   JOIN venta_detalle d ON d.venta_id = v.id
                  WHERE ${[...where, articulo].join(' AND ')}
                  GROUP BY ${a.group}
                  ORDER BY ${a.order}
                  LIMIT $${posLimit}`,
                valores
            );
            return rows;
        }

        // Sin filtro: una fila de unidades (solo productos) por venta,
        // así v.total no se multiplica al unir con el detalle
        const { rows } = await exec.query(
            `SELECT ${a.select} AS etiqueta,
                    COUNT(*)::int AS operaciones,
                    SUM(du.unidades)::int AS unidades,
                    SUM(v.total)::numeric(12,2) AS total,
                    ROUND(AVG(v.total), 2)::numeric(12,2) AS ticket_promedio
               FROM ventas v ${a.join}
               JOIN LATERAL (
                    SELECT COALESCE(SUM(cantidad), 0) AS unidades
                      FROM venta_detalle
                     WHERE venta_id = v.id AND producto_id IS NOT NULL
               ) du ON TRUE
              WHERE ${where.join(' AND ')}
              GROUP BY ${a.group}
              ORDER BY ${a.order}
              LIMIT $${posLimit}`,
            valores
        );
        return rows;
    }

    async servicios(consulta, client) {
        const { where, valores } = this.#base(consulta);
        where.push('d.servicio_id IS NOT NULL');

        if (consulta.servicioId) {
            valores.push(consulta.servicioId);
            where.push(`d.servicio_id = $${valores.length}`);
        }

        const from = (join = '') =>
            `FROM ventas v JOIN venta_detalle d ON d.venta_id = v.id ${join} WHERE ${where.join(' AND ')}`;
        const exec = this._exec(client);

        const { rows: [resumen] } = await exec.query(
            `SELECT COALESCE(SUM(d.cantidad), 0)::int AS solicitados,
                    COALESCE(SUM(d.cantidad) FILTER (WHERE v.estado = 'completada'), 0)::int AS realizados,
                    COALESCE(SUM(d.subtotal), 0)::numeric(12,2) AS ingreso
             ${from()}`,
            valores
        );

        const { rows: ranking } = await exec.query(
            `SELECT d.servicio_id, MAX(d.descripcion) AS etiqueta,
                    SUM(d.cantidad)::int AS unidades,
                    COALESCE(SUM(d.cantidad) FILTER (WHERE v.estado = 'completada'), 0)::int AS realizados,
                    SUM(d.subtotal)::numeric(12,2) AS ingreso
             ${from()}
             GROUP BY d.servicio_id
             ORDER BY unidades DESC, ingreso DESC
             LIMIT $${valores.length + 1}`,
            [...valores, consulta.limit]
        );

        let desglose = null;
        if (consulta.agrupar) {
            const G = {
                dia: {
                    sel: `((v.created_at AT TIME ZONE 'America/Mexico_City')::date)::text`,
                    grp: `(v.created_at AT TIME ZONE 'America/Mexico_City')::date`,
                    join: '',
                    ord: 'etiqueta ASC',
                },
                sucursal: {
                    sel: 's.nombre',
                    grp: 's.id, s.nombre',
                    join: 'JOIN sucursales s ON s.id = v.sucursal_id',
                    ord: 'ingreso DESC',
                },
            }[consulta.agrupar];

            ({ rows: desglose } = await exec.query(
                `SELECT ${G.sel} AS etiqueta,
                        SUM(d.cantidad)::int AS solicitados,
                        COALESCE(SUM(d.cantidad) FILTER (WHERE v.estado = 'completada'), 0)::int AS realizados,
                        SUM(d.subtotal)::numeric(12,2) AS ingreso
                 ${from(G.join)}
                 GROUP BY ${G.grp}
                 ORDER BY ${G.ord}`,
                valores
            ));
        }

        return { resumen, ranking, desglose };
    }

        async serviciosDetalle(consulta, client) {
        const { where, valores } = this.#base(consulta);
        where.push('d.servicio_id IS NOT NULL');

        if (consulta.servicioId) {
            valores.push(consulta.servicioId);
            where.push(`d.servicio_id = $${valores.length}`);
        }

        valores.push(consulta.limit, consulta.offset);
        const posLimit = valores.length - 1;
        const posOffset = valores.length;

        const { rows } = await this._exec(client).query(
            `SELECT v.id AS venta_id, v.folio, v.created_at AS fecha, v.estado,
                    s.nombre AS sucursal, u.nombre AS vendedor,
                    d.servicio_id, d.descripcion AS servicio, d.cantidad,
                    d.subtotal::numeric(12,2) AS subtotal,
                    COALESCE(ROUND(d.subtotal * v.total / NULLIF(v.subtotal, 0), 2), d.subtotal)::numeric(12,2) AS total,
                    COUNT(*) OVER() AS total_registros
               FROM ventas v
               JOIN venta_detalle d ON d.venta_id = v.id
               JOIN sucursales s ON s.id = v.sucursal_id
               JOIN optica_usuarios u ON u.id = v.vendedor_id
              WHERE ${where.join(' AND ')}
              ORDER BY v.created_at DESC, v.id ASC, d.servicio_id ASC
              LIMIT $${posLimit} OFFSET $${posOffset}`,
            valores
        );

        const total = rows.length > 0 ? Number(rows[0].total_registros) : 0;
        return { items: rows.map(({ total_registros, ...r }) => r), total };
    }

    async clientes({ sucursalIds, agrupar, desde, hasta, periodo }, client) {
        const rango = resolverRango({ desde, hasta, periodo }, 2);
        const valores = [sucursalIds, ...rango.valores];
        const exec = this._exec(client);
        const enRango = (col) => `${col} >= ${rango.inicioSql} AND ${col} < ${rango.finSql}`;

        const [total, nuevos, recurrentes, atendidos] = await Promise.all([
            exec.query(
                'SELECT COUNT(*)::int AS n FROM clientes_finales WHERE sucursal_id = ANY($1::uuid[])',
                [sucursalIds]
            ),
            exec.query(
                `SELECT COUNT(*)::int AS n FROM clientes_finales
                  WHERE sucursal_id = ANY($1::uuid[]) AND ${enRango('created_at')}`,
                valores
            ),
            exec.query(
                `SELECT COUNT(*)::int AS n FROM (
                    SELECT cliente_final_id FROM ventas
                     WHERE sucursal_id = ANY($1::uuid[]) AND estado <> 'cancelada'
                       AND cliente_final_id IS NOT NULL AND ${enRango('created_at')}
                     GROUP BY cliente_final_id HAVING COUNT(*) >= 2) t`,
                valores
            ),
            exec.query(
                `SELECT COUNT(DISTINCT cliente_final_id)::int AS n FROM citas
                  WHERE sucursal_id = ANY($1::uuid[]) AND estado = 'atendida'
                    AND ${enRango('fecha_hora')}`,
                valores
            ),
        ]);

        let desglose = null;
        if (agrupar === 'sucursal') {
            ({ rows: desglose } = await exec.query(
                `SELECT s.id AS sucursal_id, s.nombre AS etiqueta,
                        (SELECT COUNT(*) FROM clientes_finales c
                          WHERE c.sucursal_id = s.id)::int AS total,
                        (SELECT COUNT(*) FROM clientes_finales c
                          WHERE c.sucursal_id = s.id AND ${enRango('c.created_at')})::int AS nuevos,
                        (SELECT COUNT(*) FROM (
                            SELECT v.cliente_final_id FROM ventas v
                             WHERE v.sucursal_id = s.id AND v.estado <> 'cancelada'
                               AND v.cliente_final_id IS NOT NULL AND ${enRango('v.created_at')}
                             GROUP BY v.cliente_final_id HAVING COUNT(*) >= 2) t)::int AS recurrentes,
                        (SELECT COUNT(DISTINCT ci.cliente_final_id) FROM citas ci
                          WHERE ci.sucursal_id = s.id AND ci.estado = 'atendida'
                            AND ${enRango('ci.fecha_hora')})::int AS atendidos
                   FROM sucursales s
                  WHERE s.id = ANY($1::uuid[])
                  ORDER BY total DESC, s.nombre`,
                valores
            ));
        }

        return {
            total: total.rows[0].n,
            nuevos: nuevos.rows[0].n,
            recurrentes: recurrentes.rows[0].n,
            atendidos: atendidos.rows[0].n,
            desglose,
        };
    }

    async clientesActividad({ sucursalIds, busqueda, desde, hasta, periodo, limit, offset }, client) {
        const rango = resolverRango({ desde, hasta, periodo }, 2);
        const valores = [sucursalIds, ...rango.valores];
        const enRango = (col) => `${col} >= ${rango.inicioSql} AND ${col} < ${rango.finSql}`;
        const where = ['c.sucursal_id = ANY($1::uuid[])'];

        if (busqueda) {
            valores.push(`%${busqueda.replace(/[\\%_]/g, '\\$&')}%`);
            where.push(`c.nombre ILIKE $${valores.length}`);
        }
        valores.push(limit, offset);
        const posLimit = valores.length - 1;
        const posOffset = valores.length;

        const { rows } = await this._exec(client).query(
            `SELECT c.id, c.nombre, c.sucursal_id, s.nombre AS sucursal, c.created_at,
                    COALESCE(v.compras, 0)::int AS compras,
                    COALESCE(v.total, 0)::numeric(12,2) AS total_comprado,
                    COALESCE(ci.atendidas, 0)::int AS citas_atendidas,
                    GREATEST(v.ultima, ci.ultima) AS ultima_actividad,
                    COUNT(*) OVER() AS total_registros
               FROM clientes_finales c
               JOIN sucursales s ON s.id = c.sucursal_id
               LEFT JOIN LATERAL (
                    SELECT COUNT(*) AS compras, SUM(vt.total) AS total, MAX(vt.created_at) AS ultima
                      FROM ventas vt
                     WHERE vt.cliente_final_id = c.id AND vt.estado <> 'cancelada'
                       AND ${enRango('vt.created_at')}) v ON TRUE
               LEFT JOIN LATERAL (
                    SELECT COUNT(*) AS atendidas, MAX(ct.fecha_hora) AS ultima
                      FROM citas ct
                     WHERE ct.cliente_final_id = c.id AND ct.estado = 'atendida'
                       AND ${enRango('ct.fecha_hora')}) ci ON TRUE
              WHERE ${where.join(' AND ')}
              ORDER BY total_comprado DESC, c.nombre ASC
              LIMIT $${posLimit} OFFSET $${posOffset}`,
            valores
        );

        const total = rows.length > 0 ? Number(rows[0].total_registros) : 0;
        return { items: rows.map(({ total_registros, ...r }) => r), total };
    }

    async citas({ sucursalIds, estado, agrupar, desde, hasta, periodo }, client) {
        const rango = resolverRango({ desde, hasta, periodo }, 2);
        const valores = [sucursalIds, ...rango.valores];
        const where = [
            'c.sucursal_id = ANY($1::uuid[])',
            `c.fecha_hora >= ${rango.inicioSql}`,
            `c.fecha_hora < ${rango.finSql}`,
        ];
        if (estado) {
            valores.push(estado);
            where.push(`c.estado = $${valores.length}`);
        }

        const exec = this._exec(client);
        const FILTROS = `COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE c.estado = 'programada')::int AS programadas,
            COUNT(*) FILTER (WHERE c.estado = 'confirmada')::int AS confirmadas,
            COUNT(*) FILTER (WHERE c.estado = 'atendida')::int AS atendidas,
            COUNT(*) FILTER (WHERE c.estado = 'cancelada')::int AS canceladas,
            COUNT(*) FILTER (WHERE c.estado = 'no_asistio')::int AS no_asistio`;

        const { rows: [resumen] } = await exec.query(
            `SELECT ${FILTROS} FROM citas c WHERE ${where.join(' AND ')}`,
            valores
        );

        let desglose = null;
        if (agrupar === 'dia') {
            ({ rows: desglose } = await exec.query(
                `SELECT ((c.fecha_hora AT TIME ZONE 'America/Mexico_City')::date)::text AS etiqueta, ${FILTROS}
                   FROM citas c
                  WHERE ${where.join(' AND ')}
                  GROUP BY (c.fecha_hora AT TIME ZONE 'America/Mexico_City')::date
                  ORDER BY 1`,
                valores
            ));
        } else if (agrupar === 'sucursal') {
            ({ rows: desglose } = await exec.query(
                `SELECT s.nombre AS etiqueta, ${FILTROS}
                   FROM citas c
                   JOIN sucursales s ON s.id = c.sucursal_id
                  WHERE ${where.join(' AND ')}
                  GROUP BY s.id, s.nombre
                  ORDER BY total DESC`,
                valores
            ));
        }else if (agrupar === 'estado') {
            ({ rows: desglose } = await exec.query(
                `SELECT c.estado AS etiqueta, COUNT(*)::int AS total
                   FROM citas c
                  WHERE ${where.join(' AND ')}
                  GROUP BY c.estado
                  ORDER BY total DESC`,
                valores
            ));
        }

        return { ...resumen, desglose };
    }

    async inventario(c, client) {
        const exec = this._exec(client);
        const valores = [c.opticaId, c.sucursalIds];
        const where = ['p.optica_id = $1', 'p.activo = TRUE'];

        if (c.productoId) {
            valores.push(c.productoId);
            where.push(`p.id = $${valores.length}`);
        }
        if (c.busqueda) {
            valores.push(`%${c.busqueda.replace(/[\\%_]/g, '\\$&')}%`);
            where.push(`(p.nombre ILIKE $${valores.length} OR p.sku ILIKE $${valores.length})`);
        }

        const FROM = `FROM productos p
                      CROSS JOIN sucursales s
                      LEFT JOIN stock st ON st.producto_id = p.id AND st.sucursal_id = s.id
                      WHERE ${where.join(' AND ')} AND s.id = ANY($2::uuid[])`;
        const cant = 'COALESCE(st.cantidad, 0)';

        const filtrosEstado = [];
        if (c.agotados) filtrosEstado.push(`${cant} = 0`);
        if (c.bajoMinimo) filtrosEstado.push(`${cant} <= p.stock_minimo`);
        const HAVING = filtrosEstado.length ? `AND (${filtrosEstado.join(' OR ')})` : '';

        const { rows: [resumen] } = await exec.query(
            `SELECT COALESCE(SUM(${cant}), 0)::int AS existencias,
                    COUNT(*) FILTER (WHERE ${cant} > 0 AND ${cant} <= p.stock_minimo)::int AS stock_bajo,
                    COUNT(*) FILTER (WHERE ${cant} = 0)::int AS agotados
             ${FROM}`,
            valores
        );

        const { rows } = await exec.query(
            `SELECT p.id AS producto_id, p.nombre, p.sku, p.marca,
                    s.id AS sucursal_id, s.nombre AS sucursal,
                    ${cant} AS cantidad, p.stock_minimo,
                    CASE WHEN ${cant} = 0 THEN 'agotado'
                         WHEN ${cant} <= p.stock_minimo THEN 'bajo' ELSE 'normal' END AS estado,
                    COUNT(*) OVER() AS total_registros
             ${FROM} ${HAVING}
             ORDER BY p.nombre, s.nombre
             LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
            [...valores, c.limit, c.offset]
        );

        const total = rows.length > 0 ? Number(rows[0].total_registros) : 0;
        return { items: rows.map(({ total_registros, ...r }) => r), total, resumen };
    }

    async movimientos(c, client) {
        const exec = this._exec(client);
        const rango = resolverRango({ desde: c.desde, hasta: c.hasta, periodo: c.periodo }, 3);
        const valores = [c.opticaId, c.sucursalIds, ...rango.valores];
        const where = [
            'p.optica_id = $1',
            'm.sucursal_id = ANY($2::uuid[])',
            `m.created_at >= ${rango.inicioSql}`,
            `m.created_at < ${rango.finSql}`,
        ];
        if (c.productoId) {
            valores.push(c.productoId);
            where.push(`m.producto_id = $${valores.length}`);
        }
        if (c.tipo) {
            valores.push(c.tipo);
            where.push(`m.tipo = $${valores.length}`);
        }

        const FROM = `FROM stock_movimientos m JOIN productos p ON p.id = m.producto_id WHERE ${where.join(' AND ')}`;

        const { rows: [resumen] } = await exec.query(
            `SELECT COUNT(*)::int AS movimientos,
                    COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo IN ('entrada','devolucion')), 0)::int AS unidades_entrada,
                    COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo IN ('salida','venta')), 0)::int AS unidades_salida
             ${FROM}`,
            valores
        );

        // Expresiones de una lista fija del código
        const GRUPOS = {
            tipo: { sel: 'm.tipo', grp: 'm.tipo', ord: 'unidades DESC' },
            producto: { sel: 'p.nombre', grp: 'p.id, p.nombre', ord: 'unidades DESC' },
            dia: {
                sel: `((m.created_at AT TIME ZONE 'America/Mexico_City')::date)::text`,
                grp: `(m.created_at AT TIME ZONE 'America/Mexico_City')::date`,
                ord: 'etiqueta ASC',
            },
        };

        if (c.agrupar) {
            const g = GRUPOS[c.agrupar];
            const { rows } = await exec.query(
                `SELECT ${g.sel} AS etiqueta, COUNT(*)::int AS movimientos, SUM(m.cantidad)::int AS unidades
                 ${FROM}
                 GROUP BY ${g.grp}
                 ORDER BY ${g.ord}
                 LIMIT $${valores.length + 1}`,
                [...valores, c.limit]
            );
            return { ...resumen, desglose: rows, detalle: null, total: null };
        }

        const { rows } = await exec.query(
            `SELECT m.id, m.created_at, m.tipo, p.nombre AS producto, m.sucursal_id,
                    m.cantidad, m.cantidad_anterior, m.cantidad_nueva, m.motivo, m.venta_id,
                    u.nombre AS realizado_por_nombre,
                    COUNT(*) OVER() AS total_registros
             FROM stock_movimientos m
             JOIN productos p ON p.id = m.producto_id
             JOIN optica_usuarios u ON u.id = m.realizado_por
             WHERE ${where.join(' AND ')}
             ORDER BY m.created_at DESC, m.id ASC
             LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
            [...valores, c.limit, c.offset]
        );

        const total = rows.length > 0 ? Number(rows[0].total_registros) : 0;
        return {
            ...resumen,
            desglose: null,
            total,
            detalle: rows.map(({ total_registros, ...r }) => r),
        };
    }
}

module.exports = ReportesRepository;