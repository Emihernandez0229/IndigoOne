const bcrypt = require('bcrypt');
const pool = require('../../../config/db');

const SALT_ROUNDS = 10;

async function crearOptica({ codigo, razon_social, dueno_nombre, creadoPorIndigoId }) {
  const codigoNormalizado = codigo.toUpperCase();
  const passwordHash = await bcrypt.hash(codigoNormalizado, SALT_ROUNDS);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: opticaRows } = await client.query(
      `INSERT INTO opticas (codigo, razon_social, password_hash, creado_por)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [codigoNormalizado, razon_social, passwordHash, creadoPorIndigoId]
    );
    const optica = opticaRows[0];

    const { rows: duenoRows } = await client.query(
      `INSERT INTO optica_usuarios (optica_id, sucursal_id, nombre, usuario, password_hash, rol)
       VALUES ($1, NULL, $2, $3, $4, 'dueno') RETURNING *`,
      [optica.id, dueno_nombre, codigoNormalizado, passwordHash]
    );

    await client.query('COMMIT');
    return { optica, dueno: duenoRows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { crearOptica };