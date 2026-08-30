const pool = require('../../../config/db');

async function crearSucursal({ nombre, direccion, telefono, gerente_indigo_usuario_id }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: sucursalRows } = await client.query(
      `INSERT INTO indigo_sucursales (nombre, direccion, telefono)
       VALUES ($1, $2, $3) RETURNING *`,
      [nombre, direccion || null, telefono || null]
    );
    const sucursal = sucursalRows[0];

    if (gerente_indigo_usuario_id) {
      const { rows: gerenteRows } = await client.query(
        `SELECT id FROM indigo_usuarios
         WHERE id = $1 AND rol = 'gerente_sucursal' AND activo = TRUE AND sucursal_id IS NULL`,
        [gerente_indigo_usuario_id]
      );
      if (!gerenteRows[0]) {
        const err = new Error('Ese gerente no existe o ya tiene una sucursal asignada');
        err.status = 400;
        throw err;
      }
      await client.query(
        'UPDATE indigo_usuarios SET sucursal_id = $1, updated_at = now() WHERE id = $2',
        [sucursal.id, gerente_indigo_usuario_id]
      );
    }

    await client.query('COMMIT');
    return sucursal;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listarGerentesDisponibles() {
  const { rows } = await pool.query(
    `SELECT id, nombre, usuario FROM indigo_usuarios
     WHERE rol = 'gerente_sucursal' AND activo = TRUE AND sucursal_id IS NULL`
  );
  return rows;
}

async function asignarGerente({ sucursalId, gerenteIndigoUsuarioId }) {
  const { rows: sucursalRows } = await pool.query(
    'SELECT * FROM indigo_sucursales WHERE id = $1 AND activo = TRUE',
    [sucursalId]
  );
  if (!sucursalRows[0]) {
    const err = new Error('Sucursal no encontrada');
    err.status = 404;
    throw err;
  }

  if (gerenteIndigoUsuarioId) {
    const { rows: gerenteRows } = await pool.query(
      `SELECT id FROM indigo_usuarios
       WHERE id = $1 AND rol = 'gerente_sucursal' AND activo = TRUE AND sucursal_id IS NULL`,
      [gerenteIndigoUsuarioId]
    );
    if (!gerenteRows[0]) {
      const err = new Error('Ese gerente no existe o ya tiene una sucursal asignada');
      err.status = 400;
      throw err;
    }
  }


  await pool.query(
    `UPDATE indigo_usuarios SET sucursal_id = NULL, updated_at = now()
     WHERE sucursal_id = $1 AND rol = 'gerente_sucursal'`,
    [sucursalId]
  );

  if (gerenteIndigoUsuarioId) {
    await pool.query(
      'UPDATE indigo_usuarios SET sucursal_id = $1, updated_at = now() WHERE id = $2',
      [sucursalId, gerenteIndigoUsuarioId]
    );
  }

  return { sucursal_id: sucursalId, gerente_asignado_id: gerenteIndigoUsuarioId || null };
}

module.exports = { crearSucursal, listarGerentesDisponibles, asignarGerente };