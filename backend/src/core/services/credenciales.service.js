const pool = require('../../config/db');

async function existeUsuarioGlobal(usuario) {
  const { rows } = await pool.query('SELECT 1 FROM credenciales WHERE usuario = $1', [usuario]);
  return !!rows[0];
}

async function registrarCredencialGlobal(client, { usuario, tipo, referenciaId }) {
  await client.query(
    'INSERT INTO credenciales (usuario, tipo, referencia_id) VALUES ($1, $2, $3)',
    [usuario, tipo, referenciaId]
  );
}

module.exports = { existeUsuarioGlobal, registrarCredencialGlobal };