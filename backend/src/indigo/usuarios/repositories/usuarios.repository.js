const pool = require("../../../config/db");

async function existeSuperUsuario(db = pool) {
  const { rows } = await db.query(
    `SELECT id FROM indigo_usuarios WHERE rol = 'super_usuario' LIMIT 1`
  );
  return Boolean(rows[0]);
}

async function buscarPorId(id, db = pool, { bloquear = false } = {}) {
  const { rows } = await db.query(
    `
      SELECT id, nombre, rol, sucursal_id, activo
      FROM indigo_usuarios
      WHERE id = $1
      ${bloquear ? "FOR UPDATE" : ""}
    `,
    [id]
  );
  return rows[0] ?? null;
}

async function insertar(
  { sucursalId, nombre, usuario, passwordHash, rol, creadoPorId },
  db = pool
) {
  const { rows } = await db.query(
    `
      INSERT INTO indigo_usuarios (
        sucursal_id,
        nombre,
        usuario,
        password_hash,
        rol,
        dado_de_alta_por
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nombre, usuario, rol
    `,
    [sucursalId, nombre, usuario, passwordHash, rol, creadoPorId]
  );
  return rows[0];
}

async function actualizarRolYSucursal(id, rol, sucursalId, db = pool) {
  await db.query(
    `
      UPDATE indigo_usuarios
      SET rol = $1, sucursal_id = $2, updated_at = NOW()
      WHERE id = $3
    `,
    [rol, sucursalId, id]
  );
}

async function cambiarEstado(id, activo, db = pool) {
  await db.query(
    `
      UPDATE indigo_usuarios
      SET activo = $1, updated_at = NOW()
      WHERE id = $2
    `,
    [activo, id]
  );
}

async function buscarParaFront(id, db = pool) {
  const { rows } = await db.query(
    `
      WITH usuarios_numerados AS (
        SELECT
          id,
          ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS numero
        FROM indigo_usuarios
      )

      SELECT
        u.id,
        un.numero,
        u.nombre,
        u.usuario,
        u.rol,
        u.sucursal_id,
        u.activo,
        s.nombre AS sucursal_nombre

      FROM indigo_usuarios u

      INNER JOIN usuarios_numerados un
        ON un.id = u.id

      LEFT JOIN indigo_sucursales s
        ON s.id = u.sucursal_id

      WHERE u.id = $1
    `,
    [id]
  );
  return rows[0] ?? null;
}

async function listar({ rol, sucursalId, usuarioId }, db = pool) {
  let query = `
    SELECT
      u.id,

      ROW_NUMBER() OVER (
        ORDER BY u.created_at ASC, u.id ASC
      ) AS numero,

      u.nombre,
      u.usuario,
      u.rol,
      u.sucursal_id,
      u.activo,
      u.created_at,

      s.nombre AS sucursal_nombre

    FROM indigo_usuarios u

    LEFT JOIN indigo_sucursales s
      ON s.id = u.sucursal_id
  `;

  const params = [];
  const conditions = [];

  if (rol === "dueno") {
    conditions.push(`u.rol NOT IN ('super_usuario', 'dueno')`);
    conditions.push(`u.id <> $${params.length + 1}`);
    params.push(usuarioId);
  }

  if (rol === "gerente_sucursal") {
    conditions.push(`u.sucursal_id = $${params.length + 1}`);
    params.push(sucursalId);
    conditions.push(`u.rol IN ('empleado_ventas', 'empleado_laboratorio')`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")} `;
  }

  query += ` ORDER BY u.created_at ASC, u.id ASC `;

  const { rows } = await db.query(query, params);
  return rows;
}

module.exports = {
  existeSuperUsuario,
  buscarPorId,
  insertar,
  actualizarRolYSucursal,
  cambiarEstado,
  buscarParaFront,
  listar,
};