const bcrypt = require('bcrypt');
const pool = require('../../../config/db');
const { generarCredencialUnica } = require('../../../core/utils/credenciales');
const { existeUsuarioGlobal, registrarCredencialGlobal } = require('../../../core/services/credenciales.service');

const SALT_ROUNDS = 10;


async function crearGerente({ opticaId, nombre, creadoPorId }) {
  const credencial = await generarCredencialUnica('GTE', existeUsuarioGlobal);
  const passwordHash = await bcrypt.hash(credencial, SALT_ROUNDS);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO optica_usuarios (optica_id, sucursal_id, nombre, usuario, password_hash, rol, dado_de_alta_por)
       VALUES ($1, NULL, $2, $3, $4, 'encargado', $5) RETURNING *`,
      [opticaId, nombre, credencial, passwordHash, creadoPorId]
    );
    const nuevo = rows[0];

    await registrarCredencialGlobal(client, { usuario: credencial, tipo: 'optica', referenciaId: nuevo.id });

    await client.query('COMMIT');
    return { ...nuevo, credencial_provisional: credencial };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function crearEmpleado({ opticaId, sucursalId, nombre, creador }) {
  const { rows: sucursalRows } = await pool.query(
    'SELECT * FROM sucursales WHERE id = $1 AND optica_id = $2 AND activo = TRUE',
    [sucursalId, opticaId]
  );
  if (!sucursalRows[0]) {
    const err = new Error('Sucursal no encontrada en tu óptica');
    err.status = 404;
    throw err;
  }

  if (creador.rol === 'encargado') {
    const { rows: gerenciaRows } = await pool.query(
      'SELECT * FROM sucursal_gerentes WHERE sucursal_id = $1 AND optica_usuario_id = $2',
      [sucursalId, creador.id]
    );
    if (!gerenciaRows[0]) {
      const err = new Error('Solo puedes dar de alta empleados de la sucursal que gerencias');
      err.status = 403;
      throw err;
    }
  }

  const credencial = await generarCredencialUnica('EMP', existeUsuarioGlobal);
  const passwordHash = await bcrypt.hash(credencial, SALT_ROUNDS);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO optica_usuarios (optica_id, sucursal_id, nombre, usuario, password_hash, rol, dado_de_alta_por)
       VALUES ($1, $2, $3, $4, $5, 'empleado', $6) RETURNING *`,
      [opticaId, sucursalId, nombre, credencial, passwordHash, creador.id]
    );
    const nuevo = rows[0];

    await registrarCredencialGlobal(client, { usuario: credencial, tipo: 'optica', referenciaId: nuevo.id });

    await client.query('COMMIT');
    return { ...nuevo, credencial_provisional: credencial };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { crearGerente, crearEmpleado };