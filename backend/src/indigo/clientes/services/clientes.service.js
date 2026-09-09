// const bcrypt = require('bcrypt');
// const pool = require('../../../config/db');

// const SALT_ROUNDS = 10;

// async function crearOptica({ codigo, razon_social, dueno_nombre, creadoPorIndigoId }) {
//   const codigoNormalizado = codigo.toUpperCase();
//   const passwordHash = await bcrypt.hash(codigoNormalizado, SALT_ROUNDS);

//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN');

//     const { rows: opticaRows } = await client.query(
//       `INSERT INTO opticas (codigo, razon_social, password_hash, creado_por)
//        VALUES ($1, $2, $3, $4) RETURNING *`,
//       [codigoNormalizado, razon_social, passwordHash, creadoPorIndigoId]
//     );
//     const optica = opticaRows[0];

//     const { rows: duenoRows } = await client.query(
//       `INSERT INTO optica_usuarios (optica_id, sucursal_id, nombre, usuario, password_hash, rol)
//        VALUES ($1, NULL, $2, $3, $4, 'dueno') RETURNING *`,
//       [optica.id, dueno_nombre, codigoNormalizado, passwordHash]
//     );

//     await client.query('COMMIT');
//     return { optica, dueno: duenoRows[0] };
//   } catch (err) {
//     await client.query('ROLLBACK');
//     throw err;
//   } finally {
//     client.release();
//   }
// }

// module.exports = { crearOptica, buscarPorCodigo, asignarProveedor };


// async function buscarPorCodigo(codigo) {
//   const { rows: opticaRows } = await pool.query(
//     'SELECT * FROM opticas WHERE codigo = $1 AND activo = TRUE',
//     [codigo.toUpperCase()]
//   );
//   const optica = opticaRows[0];
//   if (!optica) {
//     const err = new Error('No existe ningún cliente con ese código');
//     err.status = 404;
//     throw err;
//   }

//   const { rows: sucursales } = await pool.query(
//     `SELECT s.id, s.nombre, s.direccion, s.telefono,
//             sp.indigo_sucursal_id, ind_suc.nombre AS indigo_sucursal_nombre
//      FROM sucursales s
//      LEFT JOIN sucursal_proveedor sp ON sp.sucursal_id = s.id
//      LEFT JOIN indigo_sucursales ind_suc ON ind_suc.id = sp.indigo_sucursal_id
//      WHERE s.optica_id = $1 AND s.activo = TRUE`,
//     [optica.id]
//   );

//   return { optica, sucursales };
// }

// async function asignarProveedor({ sucursalId, indigoSucursalId, creador }) {
//   const { rows: sucursalRows } = await pool.query(
//     'SELECT * FROM sucursales WHERE id = $1 AND activo = TRUE',
//     [sucursalId]
//   );
//   if (!sucursalRows[0]) {
//     const err = new Error('Esa sucursal del cliente no existe');
//     err.status = 404;
//     throw err;
//   }

//   if (creador.rol === 'gerente_sucursal' && indigoSucursalId !== creador.sucursal_id) {
//     const err = new Error('Solo puedes asignar clientes a tu propia sucursal de Indigo');
//     err.status = 403;
//     throw err;
//   }

//   const { rows: indigoSucursalRows } = await pool.query(
//     'SELECT id FROM indigo_sucursales WHERE id = $1 AND activo = TRUE',
//     [indigoSucursalId]
//   );
//   if (!indigoSucursalRows[0]) {
//     const err = new Error('Esa sucursal de Indigo no existe');
//     err.status = 404;
//     throw err;
//   }

//   const { rows } = await pool.query(
//     `INSERT INTO sucursal_proveedor (sucursal_id, indigo_sucursal_id, asignado_por)
//      VALUES ($1, $2, $3)
//      ON CONFLICT (sucursal_id)
//      DO UPDATE SET indigo_sucursal_id = $2, asignado_por = $3, updated_at = now()
//      RETURNING *`,
//     [sucursalId, indigoSucursalId, creador.id]
//   );

//   return rows[0];
// }


const bcrypt = require('bcrypt');
const pool = require('../../../config/db');
const { existeUsuarioGlobal, registrarCredencialGlobal } = require('../../../core/services/credenciales.service');

const SALT_ROUNDS = 10;


async function crearOptica({ codigo, razon_social, dueno_nombre, creadoPorIndigoId }) {
  const codigoNormalizado = codigo.toUpperCase();

  if (await existeUsuarioGlobal(codigoNormalizado)) {
    const err = new Error('Ese código ya está en uso en el sistema, usa otro');
    err.status = 409;
    throw err;
  }

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
    const dueno = duenoRows[0];

    await registrarCredencialGlobal(client, { usuario: codigoNormalizado, tipo: 'optica', referenciaId: dueno.id });

    await client.query('COMMIT');
    return { optica, dueno };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { crearOptica, buscarPorCodigo, asignarProveedor };

async function buscarPorCodigo(codigo) {
  const { rows: opticaRows } = await pool.query(
    'SELECT * FROM opticas WHERE codigo = $1 AND activo = TRUE',
    [codigo.toUpperCase()]
  );
  const optica = opticaRows[0];
  if (!optica) {
    const err = new Error('No existe ningún cliente con ese código');
    err.status = 404;
    throw err;
  }

  const { rows: sucursales } = await pool.query(
    `SELECT s.id, s.nombre, s.direccion, s.telefono,
            sp.indigo_sucursal_id, ind_suc.nombre AS indigo_sucursal_nombre
     FROM sucursales s
     LEFT JOIN sucursal_proveedor sp ON sp.sucursal_id = s.id
     LEFT JOIN indigo_sucursales ind_suc ON ind_suc.id = sp.indigo_sucursal_id
     WHERE s.optica_id = $1 AND s.activo = TRUE`,
    [optica.id]
  );

  return { optica, sucursales };
}

async function asignarProveedor({ sucursalId, indigoSucursalId, creador }) {
  const { rows: sucursalRows } = await pool.query(
    'SELECT * FROM sucursales WHERE id = $1 AND activo = TRUE',
    [sucursalId]
  );
  if (!sucursalRows[0]) {
    const err = new Error('Esa sucursal del cliente no existe');
    err.status = 404;
    throw err;
  }

  if (creador.rol === 'gerente_sucursal' && indigoSucursalId !== creador.sucursal_id) {
    const err = new Error('Solo puedes asignar clientes a tu propia sucursal de Indigo');
    err.status = 403;
    throw err;
  }

  const { rows: indigoSucursalRows } = await pool.query(
    'SELECT id FROM indigo_sucursales WHERE id = $1 AND activo = TRUE',
    [indigoSucursalId]
  );
  if (!indigoSucursalRows[0]) {
    const err = new Error('Esa sucursal de Indigo no existe');
    err.status = 404;
    throw err;
  }


  const { rows } = await pool.query(
    `INSERT INTO sucursal_proveedor (sucursal_id, indigo_sucursal_id, asignado_por)
     VALUES ($1, $2, $3)
     ON CONFLICT (sucursal_id)
     DO UPDATE SET indigo_sucursal_id = $2, asignado_por = $3, updated_at = now()
     RETURNING *`,
    [sucursalId, indigoSucursalId, creador.id]
  );

  return rows[0];
}