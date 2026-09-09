const bcrypt = require('bcrypt');

const pool = require('../../../config/db');

const {
  generarCredencialUnica
} = require('../../../core/utils/credenciales');

const {
  existeUsuarioGlobal,
  registrarCredencialGlobal
} = require('../../../core/services/credenciales.service');

const SALT_ROUNDS = 10;


async function crearGerenteEnTransaccion(
  client,
  {
    nombre,
    sucursalId,
    creadoPorId
  }
) {
  if (!nombre || !nombre.trim()) {
    const err = new Error('El nombre del gerente es requerido');
    err.status = 400;
    throw err;
  }

  const credencial = await generarCredencialUnica(
    'GTE',
    existeUsuarioGlobal
  );

  const passwordHash = await bcrypt.hash(
    credencial,
    SALT_ROUNDS
  );

  const { rows } = await client.query(
    `
      INSERT INTO indigo_usuarios (
        sucursal_id,
        nombre,
        usuario,
        password_hash,
        rol,
        dado_de_alta_por
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        'gerente_sucursal',
        $5
      )
      RETURNING
        id,
        nombre,
        usuario,
        rol,
        sucursal_id
    `,
    [
      sucursalId,
      nombre.trim(),
      credencial,
      passwordHash,
      creadoPorId
    ]
  );

  const nuevo = rows[0];

  await registrarCredencialGlobal(client, {
    usuario: credencial,
    tipo: 'indigo',
    referenciaId: nuevo.id
  });

  return {
    ...nuevo,
    credencial_provisional: credencial
  };
}


async function obtenerSucursalParaFront(sucursalId) {
  const { rows } = await pool.query(
    `
      WITH sucursales_numeradas AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            ORDER BY created_at ASC, id ASC
          ) AS numero
        FROM indigo_sucursales
      )

      SELECT
        s.id,
        sn.numero,
        s.nombre,
        s.direccion,
        s.telefono,
        s.activo,
        gerente.id AS gerente_id,
        gerente.nombre AS gerente_nombre,
        COALESCE(personal.total, 0)::INTEGER AS staff,
        COALESCE(inventario.total, 0)::INTEGER AS products

      FROM indigo_sucursales s

      INNER JOIN sucursales_numeradas sn
        ON sn.id = s.id

      LEFT JOIN indigo_usuarios gerente
        ON gerente.sucursal_id = s.id
        AND gerente.rol = 'gerente_sucursal'
        AND gerente.activo = TRUE

      LEFT JOIN (
        SELECT
          sucursal_id,
          COUNT(*) AS total
        FROM indigo_usuarios
        WHERE activo = TRUE
          AND rol IN (
            'gerente_sucursal',
            'empleado_ventas',
            'empleado_laboratorio'
          )
        GROUP BY sucursal_id
      ) personal
        ON personal.sucursal_id = s.id

      LEFT JOIN (
        SELECT
          indigo_sucursal_id,
          COALESCE(SUM(cantidad), 0) AS total
        FROM inventario_existencias
        GROUP BY indigo_sucursal_id
      ) inventario
        ON inventario.indigo_sucursal_id = s.id

      WHERE s.id = $1
    `,
    [sucursalId]
  );

  if (!rows[0]) {
    return null;
  }

  const row = rows[0];

  return {
    id: row.id,
    displayId: Number(row.numero),
    name: row.nombre,
    address: row.direccion,
    phone: row.telefono,
    manager: row.gerente_nombre ?? null,
    managerId: row.gerente_id ?? null,
    staff: row.staff,
    products: row.products,
    status: row.activo ? 'active' : 'inactive'
  };
}


async function crearSucursal({
  nombre,
  direccion,
  telefono,
  gerenteIndigoUsuarioId,
  nuevoGerenteNombre,
  creadoPorId
}) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar si ya existe una sucursal con el mismo nombre.
    const {
      rows: sucursalExistente
    } = await client.query(
      `
        SELECT id
        FROM indigo_sucursales
        WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1))
        LIMIT 1
      `,
      [nombre]
    );

    if (sucursalExistente.length > 0) {
      const err = new Error(
        'Ya existe una sucursal con ese nombre'
      );

      err.status = 409;
      throw err;
    }

    // Crear la sucursal.
    const {
      rows: sucursalRows
    } = await client.query(
      `
        INSERT INTO indigo_sucursales (
          nombre,
          direccion,
          telefono
        )
        VALUES ($1, $2, $3)
        RETURNING
          id,
          nombre,
          direccion,
          telefono,
          activo
      `,
      [
        nombre.trim(),
        direccion || null,
        telefono || null
      ]
    );

    const sucursal = sucursalRows[0];

    let gerente = null;

    // Asignar un gerente existente.
    if (gerenteIndigoUsuarioId) {
      const {
        rows: gerenteRows
      } = await client.query(
        `
          SELECT
            id,
            nombre,
            usuario,
            rol,
            sucursal_id
          FROM indigo_usuarios
          WHERE id = $1
            AND rol = 'gerente_sucursal'
            AND activo = TRUE
            AND sucursal_id IS NULL
          FOR UPDATE
        `,
        [gerenteIndigoUsuarioId]
      );

      if (!gerenteRows[0]) {
        const err = new Error(
          'Ese gerente no existe o ya tiene una sucursal asignada'
        );

        err.status = 400;
        throw err;
      }

      const {
        rows: gerenteActualizado
      } = await client.query(
        `
          UPDATE indigo_usuarios
          SET
            sucursal_id = $1,
            updated_at = NOW()
          WHERE id = $2
          RETURNING
            id,
            nombre,
            usuario,
            rol,
            sucursal_id
        `,
        [
          sucursal.id,
          gerenteIndigoUsuarioId
        ]
      );

      gerente = gerenteActualizado[0];
    }

    // Crear un gerente nuevo.
    else if (
      nuevoGerenteNombre &&
      nuevoGerenteNombre.trim()
    ) {
      gerente = await crearGerenteEnTransaccion(
        client,
        {
          nombre: nuevoGerenteNombre,
          sucursalId: sucursal.id,
          creadoPorId
        }
      );
    }

    await client.query('COMMIT');

    const resultado = await obtenerSucursalParaFront(
      sucursal.id
    );

    return resultado;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}


async function listarGerentesDisponibles(
  gerenteActualId = null
) {
  const params = [];

  let condition = `
    rol = 'gerente_sucursal'
    AND activo = TRUE
    AND sucursal_id IS NULL
  `;

  if (gerenteActualId) {
    params.push(gerenteActualId);

    condition = `
      rol = 'gerente_sucursal'
      AND activo = TRUE
      AND (
        sucursal_id IS NULL
        OR id = $1
      )
    `;
  }

  const { rows } = await pool.query(
    `
      SELECT
        id,
        nombre,
        usuario,
        sucursal_id
      FROM indigo_usuarios
      WHERE ${condition}
      ORDER BY nombre ASC
    `,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    usuario: row.usuario
  }));
}


async function asignarGerente({
  sucursalId,
  gerenteIndigoUsuarioId,
  nuevoGerenteNombre,
  creadoPorId
}) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Bloquear la sucursal durante la operación.
    const {
      rows: sucursalRows
    } = await client.query(
      `
        SELECT
          id,
          nombre,
          direccion,
          telefono,
          activo
        FROM indigo_sucursales
        WHERE id = $1
        FOR UPDATE
      `,
      [sucursalId]
    );

    if (!sucursalRows[0]) {
      const err = new Error('Sucursal no encontrada');
      err.status = 404;
      throw err;
    }

    // Liberar el gerente actualmente asignado.
    await client.query(
      `
        UPDATE indigo_usuarios
        SET
          sucursal_id = NULL,
          updated_at = NOW()
        WHERE sucursal_id = $1
          AND rol = 'gerente_sucursal'
      `,
      [sucursalId]
    );

    let gerente = null;

    // Asignar gerente existente.
    if (gerenteIndigoUsuarioId) {
      const {
        rows: gerenteRows
      } = await client.query(
        `
          SELECT
            id,
            nombre,
            usuario,
            rol,
            sucursal_id
          FROM indigo_usuarios
          WHERE id = $1
            AND rol = 'gerente_sucursal'
            AND activo = TRUE
            AND sucursal_id IS NULL
          FOR UPDATE
        `,
        [gerenteIndigoUsuarioId]
      );

      if (!gerenteRows[0]) {
        const err = new Error(
          'Ese gerente no existe o ya tiene una sucursal asignada'
        );

        err.status = 400;
        throw err;
      }

      const {
        rows: actualizado
      } = await client.query(
        `
          UPDATE indigo_usuarios
          SET
            sucursal_id = $1,
            updated_at = NOW()
          WHERE id = $2
          RETURNING
            id,
            nombre,
            usuario,
            rol,
            sucursal_id
        `,
        [
          sucursalId,
          gerenteIndigoUsuarioId
        ]
      );

      gerente = actualizado[0];
    }

    // Crear gerente nuevo.
    else if (
      nuevoGerenteNombre &&
      nuevoGerenteNombre.trim()
    ) {
      gerente = await crearGerenteEnTransaccion(
        client,
        {
          nombre: nuevoGerenteNombre,
          sucursalId,
          creadoPorId
        }
      );
    }

    await client.query('COMMIT');

    return {
      sucursal_id: sucursalId,
      gerente_asignado_id: gerente?.id ?? null,
      gerente_nombre: gerente?.nombre ?? null
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}


async function listarSucursales(usuario) {
  const params = [];
  let whereClause = '';

  if (usuario?.rol === 'gerente_sucursal') {
    whereClause = 'WHERE s.id = $1';

    params.push(usuario.sucursal_id);
  }

  const { rows } = await pool.query(
    `
      SELECT
        s.id,
        ROW_NUMBER() OVER (
          ORDER BY s.created_at ASC, s.id ASC
        ) AS numero,
        s.nombre,
        s.direccion,
        s.telefono,
        s.activo,
        gerente.id AS gerente_id,
        gerente.nombre AS gerente_nombre,
        COALESCE(personal.total, 0)::INTEGER AS staff,
        COALESCE(inventario.total, 0)::INTEGER AS products

      FROM indigo_sucursales s

      LEFT JOIN indigo_usuarios gerente
        ON gerente.sucursal_id = s.id
        AND gerente.rol = 'gerente_sucursal'
        AND gerente.activo = TRUE

      LEFT JOIN (
        SELECT
          sucursal_id,
          COUNT(*) AS total
        FROM indigo_usuarios
        WHERE activo = TRUE
          AND rol IN (
            'gerente_sucursal',
            'empleado_ventas',
            'empleado_laboratorio'
          )
        GROUP BY sucursal_id
      ) personal
        ON personal.sucursal_id = s.id

      LEFT JOIN (
        SELECT
          indigo_sucursal_id,
          COALESCE(SUM(cantidad), 0) AS total
        FROM inventario_existencias
        GROUP BY indigo_sucursal_id
      ) inventario
        ON inventario.indigo_sucursal_id = s.id

      ${whereClause}

      ORDER BY
        s.created_at ASC,
        s.id ASC
    `,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    displayId: Number(row.numero),
    name: row.nombre,
    address: row.direccion,
    phone: row.telefono,
    manager: row.gerente_nombre ?? null,
    managerId: row.gerente_id ?? null,
    staff: row.staff,
    products: row.products,
    status: row.activo ? 'active' : 'inactive'
  }));
}


async function actualizarSucursal(
  sucursalId,
  {
    nombre,
    direccion,
    telefono,
    gerenteIndigoUsuarioId,
    nuevoGerenteNombre,
    creadoPorId
  }
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar nombre duplicado.
    const {
      rows: duplicada
    } = await client.query(
      `
        SELECT id
        FROM indigo_sucursales
        WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1))
          AND id <> $2
        LIMIT 1
      `,
      [
        nombre,
        sucursalId
      ]
    );

    if (duplicada.length > 0) {
      const err = new Error(
        'Ya existe una sucursal con ese nombre'
      );

      err.status = 409;
      throw err;
    }

    // Buscar y bloquear la sucursal.
    const {
      rows: sucursalRows
    } = await client.query(
      `
        SELECT
          id,
          nombre,
          direccion,
          telefono,
          activo
        FROM indigo_sucursales
        WHERE id = $1
        FOR UPDATE
      `,
      [sucursalId]
    );

    if (!sucursalRows[0]) {
      const err = new Error('Sucursal no encontrada');
      err.status = 404;
      throw err;
    }

    // Actualizar datos de la sucursal.
    await client.query(
      `
        UPDATE indigo_sucursales
        SET
          nombre = $1,
          direccion = $2,
          telefono = $3
        WHERE id = $4
      `,
      [
        nombre.trim(),
        direccion || null,
        telefono || null,
        sucursalId
      ]
    );

    // Liberar el gerente actual.
    await client.query(
      `
        UPDATE indigo_usuarios
        SET
          sucursal_id = NULL,
          updated_at = NOW()
        WHERE sucursal_id = $1
          AND rol = 'gerente_sucursal'
      `,
      [sucursalId]
    );

    let gerente = null;

    // Asignar gerente existente.
    if (gerenteIndigoUsuarioId) {
      const {
        rows: gerenteRows
      } = await client.query(
        `
          SELECT
            id,
            nombre,
            usuario,
            rol
          FROM indigo_usuarios
          WHERE id = $1
            AND rol = 'gerente_sucursal'
            AND activo = TRUE
            AND sucursal_id IS NULL
          FOR UPDATE
        `,
        [gerenteIndigoUsuarioId]
      );

      if (!gerenteRows[0]) {
        const err = new Error(
          'Ese gerente no existe o ya tiene una sucursal asignada'
        );

        err.status = 400;
        throw err;
      }

      const {
        rows: gerenteActualizado
      } = await client.query(
        `
          UPDATE indigo_usuarios
          SET
            sucursal_id = $1,
            updated_at = NOW()
          WHERE id = $2
          RETURNING
            id,
            nombre,
            usuario,
            rol
        `,
        [
          sucursalId,
          gerenteIndigoUsuarioId
        ]
      );

      gerente = gerenteActualizado[0];
    }

    // Crear un gerente nuevo.
    else if (
      nuevoGerenteNombre &&
      nuevoGerenteNombre.trim()
    ) {
      gerente = await crearGerenteEnTransaccion(
        client,
        {
          nombre: nuevoGerenteNombre,
          sucursalId,
          creadoPorId
        }
      );
    }

    await client.query('COMMIT');

    const resultado = await obtenerSucursalParaFront(
      sucursalId
    );

    return resultado;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}


async function darDeBaja(sucursalId) {
  const { rows } = await pool.query(
    `
      UPDATE indigo_sucursales
      SET activo = FALSE
      WHERE id = $1
      RETURNING
        id,
        nombre,
        direccion,
        telefono,
        activo
    `,
    [sucursalId]
  );

  if (!rows[0]) {
    const err = new Error('Sucursal no encontrada');
    err.status = 404;
    throw err;
  }

  const resultado = await obtenerSucursalParaFront(
    sucursalId
  );

  return resultado;
}

module.exports = {
  crearSucursal,
  listarGerentesDisponibles,
  asignarGerente,
  listarSucursales,
  actualizarSucursal,
  darDeBaja
};