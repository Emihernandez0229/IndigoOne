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

// Cambia el usuario con el que inicia sesión (la clave de credenciales es el usuario)
async function cambiarUsuarioGlobal(client, { referenciaId, tipo, usuarioNuevo }) {
  await client.query(
    "UPDATE credenciales SET usuario = $1 WHERE referencia_id = $2 AND tipo = $3",
    [usuarioNuevo, referenciaId, tipo]
  );
}

module.exports = { existeUsuarioGlobal, registrarCredencialGlobal, cambiarUsuarioGlobal };