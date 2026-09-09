const pool = require('../../../config/db');

async function obtenerDashboard(usuario) {
  const { rol, sucursal_id } = usuario;

  switch (rol) {
    case 'super_usuario':
    case 'dueno':
      return obtenerDashboardDueno();

    case 'gerente_sucursal':
      return obtenerDashboardGerente(sucursal_id);

    case 'empleado_ventas':
      return obtenerDashboardVentas(sucursal_id);

    case 'empleado_laboratorio':
      return obtenerDashboardLaboratorio(sucursal_id);

    default: {
      const error = new Error('Rol de Indigo no válido');
      error.status = 403;
      throw error;
    }
  }
}

//se tiene  q cambiar
async function obtenerDashboardDueno() {
  const [
    sucursales,
    ventas,
    ventasPorSucursal,
    laboratorio,
  ] = await Promise.all([
    // Antes esto solo traía un conteo (total/activas), por eso el filtro
    // de sucursales del dashboard nunca mostraba las que ya existían -
    // faltaba justo la lista con id y nombre de cada una.
    pool.query(`
      SELECT id, nombre
      FROM indigo_sucursales
      WHERE activo = TRUE
      ORDER BY nombre
    `),

    pool.query(`
      SELECT
        COUNT(v.id)::int AS cantidad,
        COALESCE(SUM(v.total), 0)::numeric AS total
      FROM ventas v
      INNER JOIN sucursales s
        ON s.id = v.sucursal_id
      INNER JOIN sucursal_proveedor sp
        ON sp.sucursal_id = s.id
      INNER JOIN indigo_sucursales isuc
        ON isuc.id = sp.indigo_sucursal_id
      WHERE
        isuc.activo = TRUE
        AND v.estado = 'completada'
        AND DATE(v.created_at) = CURRENT_DATE
    `),

    pool.query(`
      SELECT
        isuc.id,
        isuc.nombre AS sucursal,
        COUNT(v.id)::int AS ventas,
        COALESCE(SUM(v.total), 0)::numeric AS total
      FROM indigo_sucursales isuc
      LEFT JOIN sucursal_proveedor sp
        ON sp.indigo_sucursal_id = isuc.id
      LEFT JOIN sucursales s
        ON s.id = sp.sucursal_id
      LEFT JOIN ventas v
        ON v.sucursal_id = s.id
        AND v.estado = 'completada'
      WHERE isuc.activo = TRUE
      GROUP BY isuc.id, isuc.nombre
      ORDER BY total DESC
    `),

    pool.query(`
      SELECT
        ol.id,
        ol.folio,
        ol.estado,
        ol.notas,
        ol.created_at,
        cf.nombre AS cliente,
        isuc.nombre AS sucursal
      FROM ordenes_laboratorio ol
      INNER JOIN sucursales s
        ON s.id = ol.sucursal_id
      INNER JOIN sucursal_proveedor sp
        ON sp.sucursal_id = s.id
      INNER JOIN indigo_sucursales isuc
        ON isuc.id = sp.indigo_sucursal_id
      INNER JOIN clientes_finales cf
        ON cf.id = ol.cliente_final_id
      WHERE isuc.activo = TRUE
      ORDER BY ol.created_at DESC
      LIMIT 10
    `),
  ]);

  return {
    // "name" en inglés porque así lo espera DashboardFilters.jsx
    // (branch.name) - solo nombre, nada de quién está a cargo, eso
    // se ve en el panel de "Equipo" de cada sucursal, no aquí.
    branches: sucursales.rows.map((row) => ({ id: row.id, name: row.nombre })),
    kpis: {
      sucursalesActivas: sucursales.rows.length,
      ventasHoy: Number(ventas.rows[0].total),
      cantidadVentasHoy: ventas.rows[0].cantidad,
      ordenesLaboratorio: laboratorio.rows.length,
    },
    salesByBranch: ventasPorSucursal.rows.map((row) => ({
      id: row.id,
      branch: row.sucursal,
      sales: Number(row.ventas),
      total: Number(row.total),
    })),
    laboratory: laboratorio.rows.map(mapLaboratoryJob),
    reports: {},
  };
}

//se tiene q cambiar
async function obtenerDashboardGerente(sucursalId) {
  if (!sucursalId) {
    const error = new Error('El usuario no tiene una sucursal asignada');
    error.status = 400;
    throw error;
  }

  const [sucursal, ventas, usuarios, laboratorio] = await Promise.all([
    pool.query(`
      SELECT
        id,
        nombre,
        direccion,
        telefono
      FROM indigo_sucursales
      WHERE id = $1
        AND activo = TRUE
    `, [sucursalId]),

    pool.query(`
      SELECT
        COUNT(v.id)::int AS cantidad,
        COALESCE(SUM(v.total), 0)::numeric AS total
      FROM ventas v
      INNER JOIN sucursales s
        ON s.id = v.sucursal_id
      INNER JOIN sucursal_proveedor sp
        ON sp.sucursal_id = s.id
      WHERE
        sp.indigo_sucursal_id = $1
        AND v.estado = 'completada'
        AND DATE(v.created_at) = CURRENT_DATE
    `, [sucursalId]),

    pool.query(`
      SELECT
        id,
        nombre,
        usuario,
        rol,
        activo
      FROM indigo_usuarios
      WHERE sucursal_id = $1
      ORDER BY nombre
    `, [sucursalId]),

    pool.query(`
      SELECT
        ol.id,
        ol.folio,
        ol.estado,
        ol.notas,
        ol.created_at,
        cf.nombre AS cliente
      FROM ordenes_laboratorio ol
      INNER JOIN sucursales s
        ON s.id = ol.sucursal_id
      INNER JOIN sucursal_proveedor sp
        ON sp.sucursal_id = s.id
      INNER JOIN clientes_finales cf
        ON cf.id = ol.cliente_final_id
      WHERE
        sp.indigo_sucursal_id = $1
      ORDER BY ol.created_at DESC
      LIMIT 10
    `, [sucursalId]),
  ]);

  if (sucursal.rows.length === 0) {
    const error = new Error('Sucursal no encontrada');
    error.status = 404;
    throw error;
  }

  return {
    branchName: sucursal.rows[0].nombre,

    kpis: {
      ventasHoy: Number(ventas.rows[0].total),
      cantidadVentasHoy: ventas.rows[0].cantidad,
      empleados: usuarios.rows.filter((u) => u.activo).length,
      ordenesLaboratorio: laboratorio.rows.length,
    },

    salesByEmployee: [],

    team: usuarios.rows,

    laboratory: laboratorio.rows.map(mapLaboratoryJob),
  };
}

//despues se tiene que cambiar no se te olvide
async function obtenerDashboardVentas(sucursalId) {
  if (!sucursalId) {
    const error = new Error('El usuario no tiene una sucursal asignada');
    error.status = 400;
    throw error;
  }

  const [ventas, laboratorio] = await Promise.all([
    pool.query(`
      SELECT
        v.id,
        v.folio,
        v.total,
        v.estado,
        v.created_at,
        s.nombre AS sucursal
      FROM ventas v
      INNER JOIN sucursales s
        ON s.id = v.sucursal_id
      INNER JOIN sucursal_proveedor sp
        ON sp.sucursal_id = s.id
      WHERE
        sp.indigo_sucursal_id = $1
      ORDER BY v.created_at DESC
      LIMIT 10
    `, [sucursalId]),

    pool.query(`
      SELECT
        ol.id,
        ol.folio,
        ol.estado,
        ol.created_at,
        cf.nombre AS cliente
      FROM ordenes_laboratorio ol
      INNER JOIN sucursales s
        ON s.id = ol.sucursal_id
      INNER JOIN sucursal_proveedor sp
        ON sp.sucursal_id = s.id
      INNER JOIN clientes_finales cf
        ON cf.id = ol.cliente_final_id
      WHERE
        sp.indigo_sucursal_id = $1
      ORDER BY ol.created_at DESC
      LIMIT 10
    `, [sucursalId]),
  ]);

  return {
    kpis: {
      ventas: ventas.rows.length,
      totalVentas: ventas.rows.reduce(
        (total, venta) => total + Number(venta.total),
        0
      ),
      ordenesLaboratorio: laboratorio.rows.length,
    },

    recentSales: ventas.rows,

    myLabOrders: laboratorio.rows.map(mapLaboratoryJob),
  };
}

/**
 * Dashboard para empleado de laboratorio.
 */
async function obtenerDashboardLaboratorio(sucursalId) {
  if (!sucursalId) {
    const error = new Error('El usuario no tiene una sucursal asignada');
    error.status = 400;
    throw error;
  }

  const result = await pool.query(`
    SELECT
      ol.id,
      ol.folio,
      ol.estado,
      ol.notas,
      ol.created_at,
      cf.nombre AS cliente,
      s.nombre AS sucursal
    FROM ordenes_laboratorio ol
    INNER JOIN sucursales s
      ON s.id = ol.sucursal_id
    INNER JOIN sucursal_proveedor sp
      ON sp.sucursal_id = s.id
    INNER JOIN clientes_finales cf
      ON cf.id = ol.cliente_final_id
    WHERE
      sp.indigo_sucursal_id = $1
      AND ol.estado NOT IN ('terminado_venta', 'cancelado')
    ORDER BY ol.created_at ASC
  `, [sucursalId]);

  return {
    kpis: {
      pendientes: result.rows.filter(
        (row) => row.estado === 'pendiente'
      ).length,

      enProceso: result.rows.filter(
        (row) => row.estado === 'en_proceso'
      ).length,

      total: result.rows.length,
    },

    queue: result.rows.map(mapLaboratoryJob),
  };
}

function mapLaboratoryJob(job) {
  return {
    id: job.id,
    order: job.folio,
    customer: job.cliente,
    status: job.estado,
    branch: job.sucursal ?? null,
    notes: job.notas ?? null,
    createdAt: job.created_at,
  };
}

module.exports = {
  obtenerDashboard,
};