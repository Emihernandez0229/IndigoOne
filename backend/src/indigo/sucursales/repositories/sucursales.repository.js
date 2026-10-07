const pool = require("../../../config/db");

/* =========================================================
   FRAGMENTOS COMPARTIDOS (listado y detalle)
========================================================= */

const COLUMNAS_RESUMEN = `
  s.nombre,
  s.direccion,
  s.telefono,
  s.activo,
  gerente.id AS gerente_id,
  gerente.nombre AS gerente_nombre,
  COALESCE(personal.total, 0)::INTEGER AS staff,
  COALESCE(inventario.total, 0)::INTEGER AS products
`;

const JOINS_RESUMEN = `
  LEFT JOIN indigo_usuarios gerente
    ON gerente.sucursal_id = s.id
    AND gerente.rol = 'gerente_sucursal'
    AND gerente.activo = TRUE

  LEFT JOIN (
    SELECT
      sucursal_id,
      COUNT(*) AS total
    FROM indigo_usuarios
    WHERE activo = TRUE
      AND rol IN (
        'gerente_sucursal',
        'empleado_ventas',
        'empleado_laboratorio'
      )
    GROUP BY sucursal_id
  ) personal
    ON personal.sucursal_id = s.id

  LEFT JOIN (
    SELECT
      indigo_sucursal_id,
      COALESCE(SUM(cantidad), 0) AS total
    FROM inventario_existencias
    GROUP BY indigo_sucursal_id
  ) inventario
    ON inventario.indigo_sucursal_id = s.id
`;

/* =========================================================
   SUCURSALES
========================================================= */

async function buscarActivaPorId(id, db = pool) {
  const { rows } = await db.query(
    `
      SELECT id, nombre, activo
      FROM indigo_sucursales
      WHERE id = $1 AND activo = TRUE
    `,
    [id]
  );
  return rows[0] ?? null;
}

async function buscarPorId(id, db = pool, { bloquear = false } = {}) {
  const { rows } = await db.query(
    `
      SELECT id, nombre, direccion, telefono, activo
      FROM indigo_sucursales
      WHERE id = $1
      ${bloquear ? "FOR UPDATE" : ""}
    `,
    [id]
  );
  return rows[0] ?? null;
}

async function existePorNombre(nombre, db = pool, { excluirId = null } = {}) {
  const { rows } = await db.query(
    `
      SELECT id
      FROM indigo_sucursales
      WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1))
        AND ($2::uuid IS NULL OR id <> $2)
      LIMIT 1
    `,
    [nombre, excluirId]
  );
  return Boolean(rows[0]);
}

async function crear({ nombre, direccion = null, telefono = null }, db = pool) {
  const { rows } = await db.query(
    `
      INSERT INTO indigo_sucursales (nombre, direccion, telefono)
      VALUES ($1, $2, $3)
      RETURNING id, nombre, direccion, telefono, activo
    `,
    [nombre, direccion, telefono]
  );
  return rows[0];
}

async function actualizarDatos(id, { nombre, direccion, telefono }, db = pool) {
  await db.query(
    `
      UPDATE indigo_sucursales
      SET nombre = $1, direccion = $2, telefono = $3
      WHERE id = $4
    `,
    [nombre, direccion, telefono, id]
  );
}

// Devuelve null si la sucursal no existe
async function cambiarEstado(id, activo, db = pool) {
  const { rows } = await db.query(
    `
      UPDATE indigo_sucursales
      SET activo = $1
      WHERE id = $2
      RETURNING id
    `,
    [activo, id]
  );
  return rows[0] ?? null;
}

async function listarActivas(db = pool) {
  const { rows } = await db.query(
    `
      SELECT id, nombre
      FROM indigo_sucursales
      WHERE activo = TRUE
      ORDER BY created_at ASC, id ASC
    `
  );
  return rows;
}

async function buscarParaFront(id, db = pool) {
  const { rows } = await db.query(
    `
      WITH sucursales_numeradas AS (
        SELECT
          id,
          ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS numero
        FROM indigo_sucursales
      )

      SELECT
        s.id,
        sn.numero,
        ${COLUMNAS_RESUMEN}

      FROM indigo_sucursales s

      INNER JOIN sucursales_numeradas sn
        ON sn.id = s.id

      ${JOINS_RESUMEN}

      WHERE s.id = $1
    `,
    [id]
  );
  return rows[0] ?? null;
}

/*
 * Si se pasa sucursalId (aunque sea null) solo se devuelve esa sucursal.
 * Si no se pasa, se devuelven todas.
 */
async function listarParaFront({ sucursalId } = {}, db = pool) {
  const params = [];
  let where = "";

  if (sucursalId !== undefined) {
    where = "WHERE s.id = $1";
    params.push(sucursalId);
  }

  const { rows } = await db.query(
    `
      SELECT
        s.id,
        ROW_NUMBER() OVER (ORDER BY s.created_at ASC, s.id ASC) AS numero,
        ${COLUMNAS_RESUMEN}

      FROM indigo_sucursales s

      ${JOINS_RESUMEN}

      ${where}

      ORDER BY s.created_at ASC, s.id ASC
    `,
    params
  );
  return rows;
}

/* =========================================================
   GERENTES DE SUCURSAL
========================================================= */

async function tieneGerenteActivo(sucursalId, excluirUsuarioId = null, db = pool) {
  const { rows } = await db.query(
    `
      SELECT id
      FROM indigo_usuarios
      WHERE sucursal_id = $1
        AND rol = 'gerente_sucursal'
        AND activo = TRUE
        AND ($2::uuid IS NULL OR id <> $2)
      LIMIT 1
    `,
    [sucursalId, excluirUsuarioId]
  );
  return Boolean(rows[0]);
}

// Sucursales activas sin gerente (ignorando al usuario que se edita)
async function listarSinGerente(excluirUsuarioId = null, db = pool) {
  const { rows } = await db.query(
    `
      SELECT s.id, s.nombre

      FROM indigo_sucursales s

      LEFT JOIN indigo_usuarios g
        ON g.sucursal_id = s.id
        AND g.rol = 'gerente_sucursal'
        AND g.activo = TRUE
        AND ($1::uuid IS NULL OR g.id <> $1)

      WHERE s.activo = TRUE
        AND g.id IS NULL

      ORDER BY s.created_at ASC, s.id ASC
    `,
    [excluirUsuarioId]
  );
  return rows;
}

// Gerentes activos sin sucursal (más el actual, si se está editando)
async function listarGerentesDisponibles(gerenteActualId = null, db = pool) {
  const { rows } = await db.query(
    `
      SELECT id, nombre, usuario
      FROM indigo_usuarios
      WHERE rol = 'gerente_sucursal'
        AND activo = TRUE
        AND (sucursal_id IS NULL OR id = $1::uuid)
      ORDER BY nombre ASC
    `,
    [gerenteActualId]
  );
  return rows;
}

// Gerente activo que aún no tiene sucursal (bloqueado para la transacción)
async function buscarGerenteLibre(gerenteId, db = pool) {
  const { rows } = await db.query(
    `
      SELECT id, nombre, usuario, rol
      FROM indigo_usuarios
      WHERE id = $1
        AND rol = 'gerente_sucursal'
        AND activo = TRUE
        AND sucursal_id IS NULL
      FOR UPDATE
    `,
    [gerenteId]
  );
  return rows[0] ?? null;
}

async function asignarGerenteASucursal(gerenteId, sucursalId, db = pool) {
  const { rows } = await db.query(
    `
      UPDATE indigo_usuarios
      SET sucursal_id = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, nombre, usuario, rol
    `,
    [sucursalId, gerenteId]
  );
  return rows[0];
}

// Deja a los gerentes de la sucursal sin sucursal asignada
async function liberarGerentes(sucursalId, db = pool) {
  await db.query(
    `
      UPDATE indigo_usuarios
      SET sucursal_id = NULL, updated_at = NOW()
      WHERE sucursal_id = $1
        AND rol = 'gerente_sucursal'
    `,
    [sucursalId]
  );
}

module.exports = {
  buscarActivaPorId,
  buscarPorId,
  existePorNombre,
  crear,
  actualizarDatos,
  cambiarEstado,
  listarActivas,
  buscarParaFront,
  listarParaFront,
  tieneGerenteActivo,
  listarSinGerente,
  listarGerentesDisponibles,
  buscarGerenteLibre,
  asignarGerenteASucursal,
  liberarGerentes,
};