const pool = require("../../../config/db");

/*
 * $1: sucursal de Indigo (null = todas)
 * $2: producto en particular (null = todos)
 */
const SELECT_PRODUCTOS = `
  WITH productos_numerados AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS numero
    FROM inventario_productos
  )

  SELECT
    p.*,
    n.numero,
    s.nombre AS sucursal_nombre

  FROM inventario_productos p

  INNER JOIN productos_numerados n
    ON n.id = p.id

  INNER JOIN indigo_sucursales s
    ON s.id = p.indigo_sucursal_id

  WHERE ($1::uuid IS NULL OR p.indigo_sucursal_id = $1)
    AND ($2::uuid IS NULL OR p.id = $2)

  ORDER BY p.created_at ASC, p.id ASC
`;

async function consultar({ indigoSucursalId = null, productoId = null } = {}, db = pool) {
  const { rows } = await db.query(SELECT_PRODUCTOS, [indigoSucursalId, productoId]);
  return rows;
}

async function listar({ indigoSucursalId = null } = {}, db = pool) {
  return consultar({ indigoSucursalId }, db);
}

async function buscarParaFront(id, db = pool) {
  const rows = await consultar({ productoId: id }, db);
  return rows[0] ?? null;
}

async function buscarPorId(id, db = pool, { bloquear = false } = {}) {
  const { rows } = await db.query(
    `
      SELECT id, indigo_sucursal_id, activo
      FROM inventario_productos
      WHERE id = $1
      ${bloquear ? "FOR UPDATE" : ""}
    `,
    [id]
  );
  return rows[0] ?? null;
}

async function existeCodigo(sucursalId, codigo, excluirId = null, db = pool) {
  const { rows } = await db.query(
    `
      SELECT id
      FROM inventario_productos
      WHERE indigo_sucursal_id = $1
        AND LOWER(codigo) = LOWER($2)
        AND ($3::uuid IS NULL OR id <> $3)
      LIMIT 1
    `,
    [sucursalId, codigo, excluirId]
  );
  return Boolean(rows[0]);
}

async function insertar(
  {
    sucursalId,
    codigo,
    modelo,
    descripcion,
    color,
    tipo,
    material,
    genero,
    medidas,
    stockDisponible,
    stockMinimo,
    costo,
    creadoPorId,
  },
  db = pool
) {
  const { rows } = await db.query(
    `
      INSERT INTO inventario_productos (
        indigo_sucursal_id, codigo, modelo, descripcion, color, tipo,
        material, genero, medidas, stock_disponible, stock_minimo,
        costo, creado_por
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `,
    [
      sucursalId,
      codigo,
      modelo,
      descripcion,
      color,
      tipo,
      material,
      genero,
      medidas,
      stockDisponible,
      stockMinimo,
      costo,
      creadoPorId,
    ]
  );
  return rows[0];
}

async function actualizar(
  id,
  {
    codigo,
    modelo,
    descripcion,
    color,
    tipo,
    material,
    genero,
    medidas,
    stockDisponible,
    stockMinimo,
    costo,
  },
  db = pool
) {
  await db.query(
    `
      UPDATE inventario_productos
      SET codigo = $1,
          modelo = $2,
          descripcion = $3,
          color = $4,
          tipo = $5,
          material = $6,
          genero = $7,
          medidas = $8,
          stock_disponible = $9,
          stock_minimo = $10,
          costo = $11,
          updated_at = NOW()
      WHERE id = $12
    `,
    [
      codigo,
      modelo,
      descripcion,
      color,
      tipo,
      material,
      genero,
      medidas,
      stockDisponible,
      stockMinimo,
      costo,
      id,
    ]
  );
}

async function cambiarEstado(id, activo, db = pool) {
  await db.query(
    `
      UPDATE inventario_productos
      SET activo = $1, updated_at = NOW()
      WHERE id = $2
    `,
    [activo, id]
  );
}

module.exports = {
  listar,
  buscarParaFront,
  buscarPorId,
  existeCodigo,
  insertar,
  actualizar,
  cambiarEstado,
};