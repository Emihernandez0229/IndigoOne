const bcrypt = require('bcrypt');
const pool = require('../../../config/db');

const SALT_ROUNDS = 10;

async function crearGerente({ opticaId, nombre, usuario, password, creadoPorId }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const { rows } = await pool.query(
    `INSERT INTO optica_usuarios (optica_id, sucursal_id, nombre, usuario, password_hash, rol, dado_de_alta_por)
     VALUES ($1, NULL, $2, $3, $4, 'encargado', $5) RETURNING *`,
    [opticaId, nombre, usuario, passwordHash, creadoPorId]
  );

  return rows[0];
}

async function crearEmpleado({ opticaId, sucursalId, nombre, usuario, password, creador }) {
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

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const { rows } = await pool.query(
    `INSERT INTO optica_usuarios (optica_id, sucursal_id, nombre, usuario, password_hash, rol, dado_de_alta_por)
     VALUES ($1, $2, $3, $4, $5, 'empleado', $6) RETURNING *`,
    [opticaId, sucursalId, nombre, usuario, passwordHash, creador.id]
  );

  return rows[0];
}

module.exports = { crearGerente, crearEmpleado };