const pool = require('../../../config/db');


async function crearSucursal({ opticaId, nombre, direccion, telefono, gerente_optica_usuario_id, asignarme, creadorId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: sucursalRows } = await client.query(
      `INSERT INTO sucursales (optica_id, nombre, direccion, telefono)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [opticaId, nombre, direccion || null, telefono || null]
    );
    const sucursal = sucursalRows[0];

    let gerenteAsignadoId = null;

    if (gerente_optica_usuario_id) {
      const { rows: gerenteRows } = await client.query(
        `SELECT ou.* FROM optica_usuarios ou
         WHERE ou.id = $1 AND ou.optica_id = $2 AND ou.rol = 'encargado' AND ou.activo = TRUE
           AND ou.id NOT IN (SELECT optica_usuario_id FROM sucursal_gerentes)`,
        [gerente_optica_usuario_id, opticaId]
      );
      if (!gerenteRows[0]) {
        const err = new Error('El gerente indicado no existe, no es de tu óptica, o ya tiene una sucursal asignada');
        err.status = 400;
        throw err;
      }
      gerenteAsignadoId = gerente_optica_usuario_id;
    } else if (asignarme) {
      gerenteAsignadoId = creadorId; // el propio dueño
    }

    if (gerenteAsignadoId) {
      await client.query(
        `INSERT INTO sucursal_gerentes (sucursal_id, optica_usuario_id) VALUES ($1, $2)`,
        [sucursal.id, gerenteAsignadoId]
      );
    }

    await client.query('COMMIT');
    return { sucursal, gerente_asignado_id: gerenteAsignadoId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}


async function listarGerentesDisponibles(opticaId) {
  const { rows } = await pool.query(
    `SELECT id, nombre, usuario FROM optica_usuarios
     WHERE optica_id = $1 AND rol = 'encargado' AND activo = TRUE
       AND id NOT IN (SELECT optica_usuario_id FROM sucursal_gerentes)`,
    [opticaId]
  );
  return rows;
}

module.exports = { crearSucursal, listarGerentesDisponibles };