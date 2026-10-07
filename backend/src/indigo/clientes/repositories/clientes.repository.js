const pool = require("../../../config/db");

/* =========================================================
   ÓPTICAS
========================================================= */

async function buscarOpticaActivaPorCodigo(codigo, db = pool) {
  const { rows } = await db.query(
    "SELECT * FROM opticas WHERE codigo = $1 AND activo = TRUE",
    [codigo]
  );
  return rows[0] ?? null;
}

async function insertarOptica(
  { codigo, razonSocial, passwordHash, creadoPorId },
  db = pool
) {
  const { rows } = await db.query(
    `INSERT INTO opticas (codigo, razon_social, password_hash, creado_por)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [codigo, razonSocial, passwordHash, creadoPorId]
  );
  return rows[0];
}

async function insertarDueno({ opticaId, nombre, usuario, passwordHash }, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO optica_usuarios (optica_id, sucursal_id, nombre, usuario, password_hash, rol)
     VALUES ($1, NULL, $2, $3, $4, 'dueno') RETURNING *`,
    [opticaId, nombre, usuario, passwordHash]
  );
  return rows[0];
}

/* =========================================================
   SUCURSALES DEL CLIENTE Y PROVEEDOR
========================================================= */

async function buscarSucursalActivaPorId(id, db = pool) {
  const { rows } = await db.query(
    "SELECT * FROM sucursales WHERE id = $1 AND activo = TRUE",
    [id]
  );
  return rows[0] ?? null;
}

async function listarSucursalesConProveedor(opticaId, db = pool) {
  const { rows } = await db.query(
    `SELECT s.id, s.nombre, s.direccion, s.telefono,
            sp.indigo_sucursal_id, ind_suc.nombre AS indigo_sucursal_nombre
     FROM sucursales s
     LEFT JOIN sucursal_proveedor sp ON sp.sucursal_id = s.id
     LEFT JOIN indigo_sucursales ind_suc ON ind_suc.id = sp.indigo_sucursal_id
     WHERE s.optica_id = $1 AND s.activo = TRUE`,
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
    `INSERT INTO sucursal_proveedor (sucursal_id, indigo_sucursal_id, asignado_por)
     VALUES ($1, $2, $3)
     ON CONFLICT (sucursal_id)
     DO UPDATE SET indigo_sucursal_id = $2, asignado_por = $3, updated_at = now()
     RETURNING *`,
    [sucursalId, indigoSucursalId, asignadoPorId]
  );
  return rows[0];
}

module.exports = {
  buscarOpticaActivaPorCodigo,
  insertarOptica,
  insertarDueno,
  buscarSucursalActivaPorId,
  listarSucursalesConProveedor,
  asignarProveedor,
};