// const bcrypt = require('bcrypt');
// const pool = require('../../../config/db');
// const { generarToken } = require('../../../core/utils/jwt');

// const SALT_ROUNDS = 10;

// async function loginIndigo(usuario, password) {
//   const { rows } = await pool.query(
//     'SELECT * FROM indigo_usuarios WHERE usuario = $1 AND activo = TRUE',
//     [usuario.toUpperCase()]
//   );
//   const user = rows[0];

//   if (!user) {
//     const err = new Error('Usuario o contraseña incorrectos');
//     err.status = 401;
//     throw err;
//   }

//   const passwordOk = await bcrypt.compare(password, user.password_hash);
//   if (!passwordOk) {
//     const err = new Error('Usuario o contraseña incorrectos');
//     err.status = 401;
//     throw err;
//   }

//   const token = generarToken({
//     id: user.id,
//     tipo: 'indigo',
//     rol: user.rol,
//     sucursal_id: user.sucursal_id,
//   });

//   return {
//     token,
//     usuario: { id: user.id, nombre: user.nombre, rol: user.rol, sucursal_id: user.sucursal_id },
//   };
// }

// async function loginOptica(codigo, usuario, password) {
//   const { rows: opticaRows } = await pool.query(
//     'SELECT * FROM opticas WHERE codigo = $1 AND activo = TRUE',
//     [codigo.toUpperCase()]
//   );
//   const optica = opticaRows[0];

//   if (!optica) {
//     const err = new Error('Código de óptica no encontrado');
//     err.status = 401;
//     throw err;
//   }

//   const { rows: userRows } = await pool.query(
//     'SELECT * FROM optica_usuarios WHERE optica_id = $1 AND usuario = $2 AND activo = TRUE',
//     [optica.id, usuario.toUpperCase()]
//   );
//   const user = userRows[0];

//   if (!user) {
//     const err = new Error('Usuario o contraseña incorrectos');
//     err.status = 401;
//     throw err;
//   }

//   const passwordOk = await bcrypt.compare(password, user.password_hash);
//   if (!passwordOk) {
//     const err = new Error('Usuario o contraseña incorrectos');
//     err.status = 401;
//     throw err;
//   }

//   const token = generarToken({
//     id: user.id,
//     tipo: 'optica',
//     rol: user.rol,
//     optica_id: optica.id,
//     sucursal_id: user.sucursal_id,
//   });

//   return {
//     token,
//     usuario: {
//       id: user.id,
//       nombre: user.nombre,
//       rol: user.rol,
//       optica_id: optica.id,
//       sucursal_id: user.sucursal_id,
//       password_pendiente_cambio: user.rol === 'dueño' && !optica.password_cambiada,
//     },
//   };
// }

// async function cambiarPassword({ optica_usuario_id, optica_id, passwordNueva, esDueno }) {
//   const passwordHash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);

//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN');

//     await client.query(
//       'UPDATE optica_usuarios SET password_hash = $1, updated_at = now() WHERE id = $2',
//       [passwordHash, optica_usuario_id]
//     );

//     if (esDueno) {
//       await client.query(
//         'UPDATE opticas SET password_hash = $1, password_cambiada = TRUE, updated_at = now() WHERE id = $2',
//         [passwordHash, optica_id]
//       );
//     }

//     await client.query('COMMIT');
//   } catch (err) {
//     await client.query('ROLLBACK');
//     throw err;
//   } finally {
//     client.release();
//   }
// }

// module.exports = {
//   loginIndigo,
//   loginOptica,
//   cambiarPassword,
// };

const bcrypt = require('bcrypt');
const pool = require('../../../config/db');
const { generarToken } = require('../../../core/utils/jwt');

const SALT_ROUNDS = 10;


async function login(usuario, password) {
  const usuarioNormalizado = usuario.toUpperCase();

  const { rows: credRows } = await pool.query(
    'SELECT * FROM credenciales WHERE usuario = $1',
    [usuarioNormalizado]
  );
  const credencial = credRows[0];

  if (!credencial) {
    const err = new Error('Usuario o contraseña incorrectos');
    err.status = 401;
    throw err;
  }

  if (credencial.tipo === 'indigo') {
    return loginIndigo(credencial.referencia_id, password);
  }
  return loginOptica(credencial.referencia_id, password);
}

async function loginIndigo(indigoUsuarioId, password) {
  const { rows } = await pool.query(
    'SELECT * FROM indigo_usuarios WHERE id = $1 AND activo = TRUE',
    [indigoUsuarioId]
  );
  const user = rows[0];

  if (!user) {
    const err = new Error('Usuario o contraseña incorrectos');
    err.status = 401;
    throw err;
  }

  const passwordOk = await bcrypt.compare(password, user.password_hash);
  if (!passwordOk) {
    const err = new Error('Usuario o contraseña incorrectos');
    err.status = 401;
    throw err;
  }

  const token = generarToken({
    id: user.id,
    tipo: 'indigo',
    rol: user.rol,
    sucursal_id: user.sucursal_id,
  });

  return {
    token,
    usuario: { id: user.id, nombre: user.nombre, usuario: user.usuario, tipo: 'indigo', rol: user.rol, sucursal_id: user.sucursal_id },
  };
}

async function loginOptica(opticaUsuarioId, password) {
  const { rows } = await pool.query(
    `SELECT ou.*, o.password_cambiada
     FROM optica_usuarios ou
     JOIN opticas o ON o.id = ou.optica_id
     WHERE ou.id = $1 AND ou.activo = TRUE`,
    [opticaUsuarioId]
  );
  const user = rows[0];

  if (!user) {
    const err = new Error('Usuario o contraseña incorrectos');
    err.status = 401;
    throw err;
  }

  const passwordOk = await bcrypt.compare(password, user.password_hash);
  if (!passwordOk) {
    const err = new Error('Usuario o contraseña incorrectos');
    err.status = 401;
    throw err;
  }

  const token = generarToken({
    id: user.id,
    tipo: 'optica',
    rol: user.rol,
    optica_id: user.optica_id,
    sucursal_id: user.sucursal_id,
  });

  return {
    token,
    usuario: {
      id: user.id,
      nombre: user.nombre,
      usuario: user.usuario,
      tipo: 'optica',
      rol: user.rol,
      optica_id: user.optica_id,
      sucursal_id: user.sucursal_id,
      password_pendiente_cambio: user.rol === 'dueno' && !user.password_cambiada,
    },
  };
}


async function cambiarPassword({ tipo, id, optica_id, passwordNueva, esDuenoOptica }) {
  const passwordHash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);

  if (tipo === 'indigo') {
    await pool.query(
      'UPDATE indigo_usuarios SET password_hash = $1, updated_at = now() WHERE id = $2',
      [passwordHash, id]
    );
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE optica_usuarios SET password_hash = $1, updated_at = now() WHERE id = $2',
      [passwordHash, id]
    );

    if (esDuenoOptica) {
      await client.query(
        'UPDATE opticas SET password_hash = $1, password_cambiada = TRUE, updated_at = now() WHERE id = $2',
        [passwordHash, optica_id]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { login, cambiarPassword };