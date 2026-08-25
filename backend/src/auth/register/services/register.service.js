require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../../../config/db');
const { generarTokenAutorizacion, verificarToken } = require('../../../core/utils/jwt');
const { enviarCorreo } = require('../../../core/services/email.service');
const { plantillaAutorizacionRegistro } = require('../../../core/templates/autorizacion-registro.template');

const SALT_ROUNDS = 10;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';


// registro - indigo da de alta una optica y su dueño
async function registrarOptica({ codigo, razon_social, creadoPorIndigoId }) {
  const passwordHash = await bcrypt.hash(codigo, SALT_ROUNDS);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: opticaRows } = await client.query(
      `INSERT INTO opticas (codigo, razon_social, password_hash, creado_por)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [codigo, razon_social, passwordHash, creadoPorIndigoId]
    );
    const optica = opticaRows[0];

    const { rows: duenoRows } = await client.query(
      `INSERT INTO optica_usuarios (optica_id, sucursal_id, nombre, usuario, password_hash, rol, estado)
       VALUES ($1, NULL, $2, $3, $4, 'dueño', 'autorizado') RETURNING *`,
      [optica.id, razon_social, codigo, passwordHash]
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

async function resolverAutorizador({ opticaId, sucursalId, rolSolicitante }) {
  if (rolSolicitante === 'encargado') {
    const { rows } = await pool.query(
      `SELECT * FROM optica_usuarios
       WHERE optica_id = $1 AND rol = 'dueño' AND activo = TRUE LIMIT 1`,
      [opticaId]
    );
    return rows[0] || null;
  }

  // rolSolicitante === 'empleado'
  if (sucursalId) {
    const { rows: encargadoRows } = await pool.query(
      `SELECT * FROM optica_usuarios
       WHERE optica_id = $1 AND sucursal_id = $2 AND rol = 'encargado'
         AND estado = 'autorizado' AND activo = TRUE LIMIT 1`,
      [opticaId, sucursalId]
    );
    if (encargadoRows[0]) return encargadoRows[0];
  }

  const { rows: duenoRows } = await pool.query(
    `SELECT * FROM optica_usuarios
     WHERE optica_id = $1 AND rol = 'dueño' AND activo = TRUE LIMIT 1`,
    [opticaId]
  );
  return duenoRows[0] || null;
}


// registro - Encargado o empleado se registra
async function registrarOpticaUsuario({ codigo, usuario, password, nombre, rol, sucursal_id }) {
  if (!['encargado', 'empleado'].includes(rol)) {
    const err = new Error('Rol de registro inválido');
    err.status = 400;
    throw err;
  }

  const { rows: opticaRows } = await pool.query(
    'SELECT * FROM opticas WHERE codigo = $1 AND activo = TRUE',
    [codigo]
  );
  const optica = opticaRows[0];
  if (!optica) {
    const err = new Error('Código de óptica no encontrado');
    err.status = 404;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const client = await pool.connect();
  let nuevoUsuario;
  try {
    await client.query('BEGIN');

    const { rows: nuevoRows } = await client.query(
      `INSERT INTO optica_usuarios (optica_id, sucursal_id, nombre, usuario, password_hash, rol, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'pendiente') RETURNING *`,
      [optica.id, sucursal_id || null, nombre, usuario, passwordHash, rol]
    );
    nuevoUsuario = nuevoRows[0];

    const codigoConfirmacion = Math.floor(100000 + Math.random() * 900000).toString();

    await client.query(
      `INSERT INTO solicitudes_registro (optica_usuario_id, codigo_confirmacion, estado)
       VALUES ($1, $2, 'pendiente')`,
      [nuevoUsuario.id, codigoConfirmacion]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }


  const autorizador = await resolverAutorizador({
    opticaId: optica.id,
    sucursalId: sucursal_id || null,
    rolSolicitante: rol,
  });

  if (!autorizador) {
    const err = new Error(
      'No se encontró quién deba autorizar este registro (sin encargado ni dueño disponible)'
    );
    err.status = 422;
    throw err;
  }

  if (!autorizador.email) {
    console.warn(
      `[register.service] El autorizador ${autorizador.id} (${autorizador.rol}) no tiene email registrado. No se envió correo.`
    );
    return { usuario: nuevoUsuario, autorizador, correoEnviado: false };
  }

  const token = generarTokenAutorizacion({
    optica_usuario_id: nuevoUsuario.id,
    autorizador_id: autorizador.id,
    proposito: 'autorizar_registro',
  });

  const linkConfirmacion = `${API_BASE_URL}/api/auth/register/confirmar?token=${token}`;

  await enviarCorreo({
    destinatario: autorizador.email,
    asunto: `Solicitud de acceso - ${nombre}`,
    html: plantillaAutorizacionRegistro({
      nombreDestinatario: autorizador.nombre,
      nombreSolicitante: nombre,
      rolSolicitante: rol,
      opticaNombre: optica.razon_social,
      sucursalNombre: null, // se puede enriquecer luego con el nombre real de la sucursal
      linkConfirmacion,
    }),
  });

  return { usuario: nuevoUsuario, autorizador, correoEnviado: true };
}


async function autorizarRegistro({ optica_usuario_id, codigo_confirmacion, autorizadoPorId }) {
  const { rows } = await pool.query(
    `SELECT * FROM solicitudes_registro
     WHERE optica_usuario_id = $1 AND codigo_confirmacion = $2 AND estado = 'pendiente'`,
    [optica_usuario_id, codigo_confirmacion]
  );
  const solicitud = rows[0];

  if (!solicitud) {
    const err = new Error('Solicitud no encontrada o código incorrecto');
    err.status = 404;
    throw err;
  }

  await _resolverSolicitud({ solicitudId: solicitud.id, opticaUsuarioId: optica_usuario_id, autorizadoPorId, aprobar: true });
}


async function resolverPorToken({ token, aprobar }) {
  let payload;
  try {
    payload = verificarToken(token);
  } catch (err) {
    const e = new Error('El enlace es inválido o ya expiró');
    e.status = 400;
    throw e;
  }

  if (payload.proposito !== 'autorizar_registro') {
    const e = new Error('Enlace inválido para esta operación');
    e.status = 400;
    throw e;
  }

  const { rows } = await pool.query(
    `SELECT * FROM solicitudes_registro
     WHERE optica_usuario_id = $1 AND estado = 'pendiente'`,
    [payload.optica_usuario_id]
  );
  const solicitud = rows[0];

  if (!solicitud) {
    const e = new Error('Esta solicitud ya fue resuelta o no existe');
    e.status = 409;
    throw e;
  }

  await _resolverSolicitud({
    solicitudId: solicitud.id,
    opticaUsuarioId: payload.optica_usuario_id,
    autorizadoPorId: payload.autorizador_id,
    aprobar,
  });

  return { aprobado: aprobar };
}

async function obtenerDatosParaConfirmacion(token) {
  let payload;
  try {
    payload = verificarToken(token);
  } catch (err) {
    const e = new Error('El enlace es inválido o ya expiró');
    e.status = 400;
    throw e;
  }

  const { rows } = await pool.query(
    `SELECT ou.nombre, ou.rol, o.razon_social AS optica_nombre
     FROM optica_usuarios ou
     JOIN opticas o ON o.id = ou.optica_id
     WHERE ou.id = $1`,
    [payload.optica_usuario_id]
  );

  if (!rows[0]) {
    const e = new Error('Solicitud no encontrada');
    e.status = 404;
    throw e;
  }

  return rows[0];
}

async function _resolverSolicitud({ solicitudId, opticaUsuarioId, autorizadoPorId, aprobar }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE solicitudes_registro
       SET estado = $1, autorizado_por = $2, resuelto_at = now()
       WHERE id = $3`,
      [aprobar ? 'autorizado' : 'rechazado', autorizadoPorId, solicitudId]
    );

    await client.query(
      `UPDATE optica_usuarios
       SET estado = $1, dado_de_alta_por = $2
       WHERE id = $3`,
      [aprobar ? 'autorizado' : 'rechazado', autorizadoPorId, opticaUsuarioId]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  registrarOptica,
  registrarOpticaUsuario,
  autorizarRegistro,
  resolverPorToken,
  obtenerDatosParaConfirmacion,
};