const bcrypt = require('bcrypt');
const pool = require('../../../config/db');
const { generarCredencialUnica } = require('../../../core/utils/credenciales');

const SALT_ROUNDS = 10;

async function existeUsuarioIndigo(usuario) {
  const { rows } = await pool.query('SELECT id FROM indigo_usuarios WHERE usuario = $1', [usuario]);
  return !!rows[0];
}

async function crearPrimerSuperUsuario({ nombre, usuario, password }) {
  const { rows: existentes } = await pool.query(
    `SELECT id FROM indigo_usuarios WHERE rol = 'super_usuario' LIMIT 1`
  );
  if (existentes[0]) {
    const err = new Error('Ya existe un super usuario. Este endpoint solo funciona la primera vez.');
    err.status = 403;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const { rows } = await pool.query(
    `INSERT INTO indigo_usuarios (sucursal_id, nombre, usuario, password_hash, rol)
     VALUES (NULL, $1, $2, $3, 'super_usuario') RETURNING id, nombre, usuario, rol`,
    [nombre, usuario.toUpperCase(), passwordHash]
  );
  return rows[0];
}

async function crearSuperUsuario({ nombre, creadoPorId }) {
  const credencial = await generarCredencialUnica('SU', existeUsuarioIndigo);
  const passwordHash = await bcrypt.hash(credencial, SALT_ROUNDS);

  const { rows } = await pool.query(
    `INSERT INTO indigo_usuarios (sucursal_id, nombre, usuario, password_hash, rol, dado_de_alta_por)
     VALUES (NULL, $1, $2, $3, 'super_usuario', $4) RETURNING id, nombre, usuario, rol`,
    [nombre, credencial, passwordHash, creadoPorId]
  );
  return { ...rows[0], credencial_provisional: credencial };
}

async function crearDueno({ nombre, creadoPorId }) {
  const credencial = await generarCredencialUnica('DUE', existeUsuarioIndigo);
  const passwordHash = await bcrypt.hash(credencial, SALT_ROUNDS);

  const { rows } = await pool.query(
    `INSERT INTO indigo_usuarios (sucursal_id, nombre, usuario, password_hash, rol, dado_de_alta_por)
     VALUES (NULL, $1, $2, $3, 'dueno', $4) RETURNING id, nombre, usuario, rol`,
    [nombre, credencial, passwordHash, creadoPorId]
  );
  return { ...rows[0], credencial_provisional: credencial };
}

async function crearGerenteSucursal({ nombre, sucursal_id, creadoPorId }) {
  if (sucursal_id) {
    const { rows: sucursalRows } = await pool.query(
      'SELECT * FROM indigo_sucursales WHERE id = $1 AND activo = TRUE',
      [sucursal_id]
    );
    if (!sucursalRows[0]) {
      const err = new Error('La sucursal indicada no existe');
      err.status = 404;
      throw err;
    }

    const { rows: gerenteExistente } = await pool.query(
      `SELECT id FROM indigo_usuarios WHERE sucursal_id = $1 AND rol = 'gerente_sucursal' AND activo = TRUE`,
      [sucursal_id]
    );
    if (gerenteExistente[0]) {
      const err = new Error('Esa sucursal ya tiene un gerente asignado');
      err.status = 400;
      throw err;
    }
  }

  const credencial = await generarCredencialUnica('GTE', existeUsuarioIndigo);
  const passwordHash = await bcrypt.hash(credencial, SALT_ROUNDS);

  const { rows } = await pool.query(
    `INSERT INTO indigo_usuarios (sucursal_id, nombre, usuario, password_hash, rol, dado_de_alta_por)
     VALUES ($1, $2, $3, $4, 'gerente_sucursal', $5) RETURNING *`,
    [sucursal_id || null, nombre, credencial, passwordHash, creadoPorId]
  );
  return { ...rows[0], credencial_provisional: credencial };
}

async function crearEmpleado({ nombre, tipo, creadorSucursalId, creadoPorId }) {
  if (!['ventas', 'laboratorio'].includes(tipo)) {
    const err = new Error("El tipo de empleado debe ser 'ventas' o 'laboratorio'");
    err.status = 400;
    throw err;
  }
  if (!creadorSucursalId) {
    const err = new Error('El gerente que da de alta debe tener una sucursal asignada');
    err.status = 400;
    throw err;
  }

  const rol = tipo === 'ventas' ? 'empleado_ventas' : 'empleado_laboratorio';
  const prefijo = tipo === 'ventas' ? 'VTA' : 'LAB';
  const credencial = await generarCredencialUnica(prefijo, existeUsuarioIndigo);
  const passwordHash = await bcrypt.hash(credencial, SALT_ROUNDS);

  const { rows } = await pool.query(
    `INSERT INTO indigo_usuarios (sucursal_id, nombre, usuario, password_hash, rol, dado_de_alta_por)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [creadorSucursalId, nombre, credencial, passwordHash, rol, creadoPorId]
  );
  return { ...rows[0], credencial_provisional: credencial };
}

module.exports = {
  crearPrimerSuperUsuario,
  crearSuperUsuario,
  crearDueno,
  crearGerenteSucursal,
  crearEmpleado,
};