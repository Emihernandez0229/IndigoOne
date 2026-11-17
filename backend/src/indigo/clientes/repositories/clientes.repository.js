const pool = require("../../../config/db");

/*
 * Consulta de clientes para el front.
 * $1: sucursal de Indigo (null = todas). Con una sucursal solo se devuelven
 *     los clientes que atiende y solo las sucursales de esos clientes que
 *     atiende; el estado es el de esa relación.
 * $2: óptica en particular (null = todas).
 */
const SELECT_CLIENTES = `
  WITH opticas_numeradas AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS numero
    FROM opticas
  )

  SELECT
    o.id,
    n.numero,
    o.codigo,
    o.razon_social,
    o.rfc,
    o.telefono,
    o.correo,
    o.pais,
    o.estado,
    o.municipio,
    o.direccion,
    o.codigo_postal,
    CASE
      WHEN $1::uuid IS NULL THEN o.activo
      ELSE COALESCE(ramas.alguna_activa, FALSE)
    END AS activo,
    COALESCE(ramas.lista, '[]'::json) AS sucursales

  FROM opticas o

  INNER JOIN opticas_numeradas n
    ON n.id = o.id

  LEFT JOIN (
    SELECT
      s.optica_id,
      bool_or(s.activo) AS alguna_activa,
      json_agg(
        json_build_object(
          'id', s.id,
          'name', s.nombre,
          'address', s.direccion,
          'indigoBranchId', sp.indigo_sucursal_id,
          'indigoBranchName', isu.nombre,
          'status', CASE WHEN s.activo THEN 'active' ELSE 'inactive' END
        )
        ORDER BY s.created_at ASC, s.id ASC
      ) AS lista
    FROM sucursales s
    LEFT JOIN sucursal_proveedor sp ON sp.sucursal_id = s.id
    LEFT JOIN indigo_sucursales isu ON isu.id = sp.indigo_sucursal_id
    WHERE ($1::uuid IS NULL OR sp.indigo_sucursal_id = $1)
    GROUP BY s.optica_id
  ) ramas
    ON ramas.optica_id = o.id

  WHERE (
      $1::uuid IS NULL
      OR EXISTS (
        SELECT 1
        FROM sucursales s2
        INNER JOIN sucursal_proveedor sp2 ON sp2.sucursal_id = s2.id
        WHERE s2.optica_id = o.id
          AND sp2.indigo_sucursal_id = $1
      )
    )
    AND ($2::uuid IS NULL OR o.id = $2)

  ORDER BY o.created_at ASC, o.id ASC
`;

async function consultar({ indigoSucursalId = null, opticaId = null } = {}, db = pool) {
  const { rows } = await db.query(SELECT_CLIENTES, [indigoSucursalId, opticaId]);
  return rows;
}

async function listarParaFront({ indigoSucursalId = null } = {}, db = pool) {
  return consultar({ indigoSucursalId }, db);
}

// La sucursal de Indigo (si se pasa) acota qué sucursales del cliente se ven
async function buscarParaFront(id, indigoSucursalId = null, db = pool) {
  const rows = await consultar({ indigoSucursalId, opticaId: id }, db);
  return rows[0] ?? null;
}

/* =========================================================
   ÓPTICAS
========================================================= */

async function buscarPorId(id, db = pool, { bloquear = false } = {}) {
  const { rows } = await db.query(
    `
      SELECT id, codigo, activo
      FROM opticas
      WHERE id = $1
      ${bloquear ? "FOR UPDATE" : ""}
    `,
    [id]
  );
  return rows[0] ?? null;
}

async function buscarOpticaActivaPorCodigo(codigo, db = pool) {
  const { rows } = await db.query(
    "SELECT * FROM opticas WHERE codigo = $1 AND activo = TRUE",
    [codigo]
  );
  return rows[0] ?? null;
}

async function insertarOptica(
  {
    codigo,
    razonSocial,
    rfc,
    pais,
    estado,
    municipio,
    direccion,
    codigoPostal,
    passwordHash,
    creadoPorId,
  },
  db = pool
) {
  const { rows } = await db.query(
    `
      INSERT INTO opticas (
        codigo, razon_social, rfc, pais, estado, municipio,
        direccion, codigo_postal, password_hash, creado_por
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `,
    [
      codigo,
      razonSocial,
      rfc,
      pais,
      estado,
      municipio,
      direccion,
      codigoPostal,
      passwordHash,
      creadoPorId,
    ]
  );
  return rows[0];
}

async function insertarDueno({ opticaId, nombre, usuario, passwordHash }, db = pool) {
  const { rows } = await db.query(
    `
      INSERT INTO optica_usuarios (optica_id, sucursal_id, nombre, usuario, password_hash, rol)
      VALUES ($1, NULL, $2, $3, $4, 'dueno')
      RETURNING id
    `,
    [opticaId, nombre, usuario, passwordHash]
  );
  return rows[0];
}

async function actualizarDatos(
  id,
  { razonSocial, rfc, municipio, direccion, codigoPostal },
  db = pool
) {
  await db.query(
    `
      UPDATE opticas
      SET razon_social = $1,
          rfc = $2,
          municipio = $3,
          direccion = $4,
          codigo_postal = $5,
          updated_at = NOW()
      WHERE id = $6
    `,
    [razonSocial, rfc, municipio, direccion, codigoPostal, id]
  );
}

// ¿La óptica tiene alguna sucursal surtida por esa sucursal de Indigo?
async function perteneceASucursal(opticaId, indigoSucursalId, db = pool) {
  const { rows } = await db.query(
    `
      SELECT 1
      FROM sucursales s
      INNER JOIN sucursal_proveedor sp ON sp.sucursal_id = s.id
      WHERE s.optica_id = $1
        AND sp.indigo_sucursal_id = $2
      LIMIT 1
    `,
    [opticaId, indigoSucursalId]
  );
  return Boolean(rows[0]);
}

/*
 * ¿Hay alguna sucursal activa del cliente dentro del alcance?
 * indigoSucursalId null = todas las sucursales del cliente.
 */
async function estaActivoEnAlcance(opticaId, indigoSucursalId, db = pool) {
  const { rows } = await db.query(
    `
      SELECT COALESCE(bool_or(s.activo), FALSE) AS activo
      FROM sucursales s
      LEFT JOIN sucursal_proveedor sp ON sp.sucursal_id = s.id
      WHERE s.optica_id = $1
        AND ($2::uuid IS NULL OR sp.indigo_sucursal_id = $2)
    `,
    [opticaId, indigoSucursalId]
  );
  return rows[0].activo;
}

// Activa/desactiva las sucursales del cliente dentro del alcance
async function cambiarEstadoSucursales(opticaId, activo, indigoSucursalId, db = pool) {
  await db.query(
    `
      UPDATE sucursales s
      SET activo = $1
      WHERE s.optica_id = $2
        AND (
          $3::uuid IS NULL
          OR EXISTS (
            SELECT 1
            FROM sucursal_proveedor sp
            WHERE sp.sucursal_id = s.id
              AND sp.indigo_sucursal_id = $3
          )
        )
    `,
    [activo, opticaId, indigoSucursalId]
  );
}

// La óptica queda activa mientras tenga alguna sucursal activa
async function sincronizarEstadoOptica(opticaId, db = pool) {
  await db.query(
    `
      UPDATE opticas
      SET activo = EXISTS (
            SELECT 1 FROM sucursales WHERE optica_id = $1 AND activo = TRUE
          ),
          updated_at = NOW()
      WHERE id = $1
    `,
    [opticaId]
  );
}

/* =========================================================
   SUCURSALES DEL CLIENTE Y PROVEEDOR
========================================================= */

async function insertarSucursalCliente({ opticaId, nombre }, db = pool) {
  const { rows } = await db.query(
    `
      INSERT INTO sucursales (optica_id, nombre)
      VALUES ($1, $2)
      RETURNING id
    `,
    [opticaId, nombre]
  );
  return rows[0];
}

async function buscarSucursalActivaPorId(id, db = pool) {
  const { rows } = await db.query(
    "SELECT * FROM sucursales WHERE id = $1 AND activo = TRUE",
    [id]
  );
  return rows[0] ?? null;
}

async function listarSucursalesConProveedor(opticaId, db = pool) {
  const { rows } = await db.query(
    `
      SELECT s.id, s.nombre, s.direccion, s.telefono,
             sp.indigo_sucursal_id, ind_suc.nombre AS indigo_sucursal_nombre
      FROM sucursales s
      LEFT JOIN sucursal_proveedor sp ON sp.sucursal_id = s.id
      LEFT JOIN indigo_sucursales ind_suc ON ind_suc.id = sp.indigo_sucursal_id
      WHERE s.optica_id = $1 AND s.activo = TRUE
    `,
    [opticaId]
  );
  return rows;
}

// Crea la asignación o la reemplaza si la sucursal ya tenía proveedor
async function asignarProveedor(
  { sucursalId, indigoSucursalId, asignadoPorId },
  db = pool
) {
  const { rows } = await db.query(
    `
      INSERT INTO sucursal_proveedor (sucursal_id, indigo_sucursal_id, asignado_por)
      VALUES ($1, $2, $3)
      ON CONFLICT (sucursal_id)
      DO UPDATE SET indigo_sucursal_id = $2, asignado_por = $3, updated_at = now()
      RETURNING *
    `,
    [sucursalId, indigoSucursalId, asignadoPorId]
  );
  return rows[0];
}

module.exports = {
  listarParaFront,
  buscarParaFront,
  buscarPorId,
  buscarOpticaActivaPorCodigo,
  insertarOptica,
  insertarDueno,
  actualizarDatos,
  perteneceASucursal,
  estaActivoEnAlcance,
  cambiarEstadoSucursales,
  sincronizarEstadoOptica,
  insertarSucursalCliente,
  buscarSucursalActivaPorId,
  listarSucursalesConProveedor,
  asignarProveedor,
};