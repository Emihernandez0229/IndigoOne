const pool = require("../../../config/db");

/*
 * $1: sucursal de Indigo (null = todas)
 * $2: quien lo registró (null = cualquiera)
 * $3: trabajo en particular (null = todos)
 * Orden: pendientes, en proceso, terminados, garantía y mermas; dentro de
 * cada grupo, urgentes primero y los que se entregan antes.
 */
const SELECT_TRABAJOS = `
  SELECT
    t.*,
    s.nombre AS sucursal_nombre,
    o.razon_social AS optica_nombre,
    v.nombre AS vendedor_nombre,
    c.nombre AS creado_por_nombre,
    a.nombre AS aceptado_por_nombre,
    r.nombre AS realizado_por_nombre,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object('text', d.texto, 'author', du.nombre, 'at', d.created_at)
          ORDER BY d.created_at ASC, d.id ASC
        )
        FROM indigo_trabajo_detalles d
        INNER JOIN indigo_usuarios du ON du.id = d.creado_por
        WHERE d.trabajo_id = t.id
      ),
      '[]'::json
    ) AS detalles

  FROM indigo_trabajos t

  INNER JOIN indigo_sucursales s ON s.id = t.indigo_sucursal_id
  INNER JOIN opticas o ON o.id = t.optica_id
  INNER JOIN indigo_usuarios v ON v.id = t.vendedor_id
  INNER JOIN indigo_usuarios c ON c.id = t.creado_por
  LEFT JOIN indigo_usuarios a ON a.id = t.aceptado_por
  LEFT JOIN indigo_usuarios r ON r.id = t.realizado_por

  WHERE ($1::uuid IS NULL OR t.indigo_sucursal_id = $1)
    AND ($2::uuid IS NULL OR t.creado_por = $2)
    AND ($3::uuid IS NULL OR t.id = $3)

  ORDER BY
    CASE t.estado
      WHEN 'pendiente' THEN 1
      WHEN 'en_proceso' THEN 2
      WHEN 'terminado' THEN 3
      WHEN 'garantia' THEN 4
      ELSE 5
    END,
    t.urgente DESC,
    t.fecha_entrega ASC,
    t.created_at DESC
`;

async function consultar(
  { indigoSucursalId = null, creadoPor = null, trabajoId = null } = {},
  db = pool
) {
  const { rows } = await db.query(SELECT_TRABAJOS, [
    indigoSucursalId,
    creadoPor,
    trabajoId,
  ]);
  return rows;
}

async function listar({ indigoSucursalId = null, creadoPor = null } = {}, db = pool) {
  return consultar({ indigoSucursalId, creadoPor }, db);
}

async function buscarParaFront(id, db = pool) {
  const rows = await consultar({ trabajoId: id }, db);
  return rows[0] ?? null;
}

async function buscarPorId(id, db = pool, { bloquear = false } = {}) {
  const { rows } = await db.query(
    `
      SELECT id, indigo_sucursal_id, estado
      FROM indigo_trabajos
      WHERE id = $1
      ${bloquear ? "FOR UPDATE" : ""}
    `,
    [id]
  );
  return rows[0] ?? null;
}

async function insertar(
  {
    indigoSucursalId,
    opticaId,
    vendedorId,
    creadoPorId,
    tipoServicio,
    tipoBisel,
    cantidad,
    urgente,
    fechaEntrega,
  },
  db = pool
) {
  const { rows } = await db.query(
    `
      INSERT INTO indigo_trabajos (
        indigo_sucursal_id, optica_id, vendedor_id, creado_por,
        tipo_servicio, tipo_bisel, cantidad, urgente, fecha_entrega
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `,
    [
      indigoSucursalId,
      opticaId,
      vendedorId,
      creadoPorId,
      tipoServicio,
      tipoBisel,
      cantidad,
      urgente,
      fechaEntrega,
    ]
  );
  return rows[0];
}

async function marcarAceptado(id, usuarioId, db = pool) {
  await db.query(
    `
      UPDATE indigo_trabajos
      SET estado = 'en_proceso',
          aceptado_por = $1,
          aceptado_at = NOW(),
          updated_at = NOW()
      WHERE id = $2
    `,
    [usuarioId, id]
  );
}

async function marcarTerminado(id, usuarioId, db = pool) {
  await db.query(
    `
      UPDATE indigo_trabajos
      SET estado = 'terminado',
          realizado_por = $1,
          finalizado_at = NOW(),
          updated_at = NOW()
      WHERE id = $2
    `,
    [usuarioId, id]
  );
}

async function marcarMerma(id, usuarioId, motivo, db = pool) {
  await db.query(
    `
      UPDATE indigo_trabajos
      SET estado = 'merma',
          realizado_por = $1,
          motivo_merma = $2,
          finalizado_at = NOW(),
          updated_at = NOW()
      WHERE id = $3
    `,
    [usuarioId, motivo, id]
  );
}

async function insertarDetalle({ trabajoId, texto, creadoPorId }, db = pool) {
  await db.query(
    `
      INSERT INTO indigo_trabajo_detalles (trabajo_id, texto, creado_por)
      VALUES ($1, $2, $3)
    `,
    [trabajoId, texto, creadoPorId]
  );
}

module.exports = {
  listar,
  buscarParaFront,
  buscarPorId,
  insertar,
  marcarAceptado,
  marcarTerminado,
  marcarMerma,
  insertarDetalle,
};