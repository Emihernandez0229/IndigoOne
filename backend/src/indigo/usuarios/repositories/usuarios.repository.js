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
      SELECT id, nombre, usuario, rol, sucursal_id, activo
      FROM indigo_usuarios
      WHERE id = $1
      ${bloquear ? "FOR UPDATE" : ""}
    `,
    [id]
  );
  return rows[0] ?? null;
}

// ¿Ya hay alguien activo con ese puesto (gerente/subgerente) en la sucursal?
async function existeRolActivoEnSucursal(
  sucursalId,
  rol,
  excluirUsuarioId = null,
  db = pool
) {
  const { rows } = await db.query(
    `
      SELECT id
      FROM indigo_usuarios
      WHERE sucursal_id = $1
        AND rol = $2
        AND activo = TRUE
        AND ($3::uuid IS NULL OR id <> $3)
      LIMIT 1
    `,
    [sucursalId, rol, excluirUsuarioId]
  );
  return Boolean(rows[0]);
}

async function insertar(
  {
    sucursalId,
    nombre,
    usuario,
    passwordHash,
    rol,
    creadoPorId,
    telefono = null,
    correo = null,
    passwordCambiada = false,
  },
  db = pool
) {
  const { rows } = await db.query(
    `
      INSERT INTO indigo_usuarios (
        sucursal_id,
        nombre,
        usuario,
        password_hash,
        telefono,
        correo,
        rol,
        dado_de_alta_por,
        password_cambiada
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, nombre, usuario, rol
    `,
    [
      sucursalId,
      nombre,
      usuario,
      passwordHash,
      telefono,
      correo,
      rol,
      creadoPorId,
      passwordCambiada,
    ]
  );
  return rows[0];
}

// Edición hecha por un administrador (puede cambiar rol y sucursal)
async function actualizarDatos(
  id,
  { nombre, usuario, telefono, correo, rol, sucursalId },
  db = pool
) {
  await db.query(
    `
      UPDATE indigo_usuarios
      SET nombre = $1,
          usuario = $2,
          telefono = $3,
          correo = $4,
          rol = $5,
          sucursal_id = $6,
          updated_at = NOW()
      WHERE id = $7
    `,
    [nombre, usuario, telefono, correo, rol, sucursalId, id]
  );
}

// Edición del propio perfil (no toca rol ni sucursal)
async function actualizarPerfil(id, { nombre, usuario, telefono, correo }, db = pool) {
  await db.query(
    `
      UPDATE indigo_usuarios
      SET nombre = $1,
          usuario = $2,
          telefono = $3,
          correo = $4,
          updated_at = NOW()
      WHERE id = $5
    `,
    [nombre, usuario, telefono, correo, id]
  );
}

async function buscarPasswordHash(id, db = pool) {
  const { rows } = await db.query(
    "SELECT password_hash FROM indigo_usuarios WHERE id = $1",
    [id]
  );
  return rows[0]?.password_hash ?? null;
}

async function actualizarPassword(id, passwordHash, passwordCambiada, db = pool) {
  await db.query(
    `
      UPDATE indigo_usuarios
      SET password_hash = $1,
          password_cambiada = $2,
          updated_at = NOW()
      WHERE id = $3
    `,
    [passwordHash, passwordCambiada, id]
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
        u.telefono,
        u.correo,
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

/*
 * roles: arreglo de roles a mostrar (null = todos).
 * sucursalId: si se pasa (aunque sea null) solo se muestra esa sucursal;
 * si es undefined no se filtra por sucursal.
 */
async function listar({ roles, sucursalId }, db = pool) {
  let query = `
    SELECT
      u.id,

      ROW_NUMBER() OVER (
        ORDER BY u.created_at ASC, u.id ASC
      ) AS numero,

      u.nombre,
      u.usuario,
      u.telefono,
      u.correo,
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

  if (roles) {
    params.push(roles);
    conditions.push(`u.rol = ANY($${params.length})`);
  }

  if (sucursalId !== undefined) {
    params.push(sucursalId);
    conditions.push(`u.sucursal_id = $${params.length}`);
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
  existeRolActivoEnSucursal,
  insertar,
  actualizarDatos,
  actualizarPerfil,
  buscarPasswordHash,
  actualizarPassword,
  cambiarEstado,
  buscarParaFront,
  listar,
};