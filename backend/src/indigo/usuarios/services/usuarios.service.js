
const bcrypt = require("bcrypt");

const pool = require("../../../config/db");

const {
  generarCredencialUnica,
} = require("../../../core/utils/credenciales");

const {
  existeUsuarioGlobal,
  registrarCredencialGlobal,
} = require("../../../core/services/credenciales.service");


const SALT_ROUNDS = 10;


/* =========================================================
   UTILIDADES
========================================================= */

function lanzarError(mensaje, status = 400) {
  const err = new Error(mensaje);
  err.status = status;
  throw err;
}


function validarRolPermitido(creadorRol, rolNuevo) {

  const permisos = {
    super_usuario: [
      "super_usuario",
      "dueno",
      "gerente_sucursal",
      "empleado_ventas",
      "empleado_laboratorio",
    ],

    dueno: [
      "gerente_sucursal",
      "empleado_ventas",
      "empleado_laboratorio",
    ],

    gerente_sucursal: [
      "empleado_ventas",
      "empleado_laboratorio",
    ],
  };


  const rolesPermitidos =
    permisos[creadorRol] ?? [];


  if (!rolesPermitidos.includes(rolNuevo)) {
    lanzarError(
      "No tienes permiso para crear o asignar ese rol.",
      403
    );
  }
}


async function obtenerSucursal(client, sucursalId) {

  const { rows } =
    await client.query(
      `
        SELECT
          id,
          nombre,
          activo
        FROM indigo_sucursales
        WHERE id = $1
          AND activo = TRUE
      `,
      [sucursalId]
    );


  if (!rows[0]) {
    lanzarError(
      "La sucursal indicada no existe.",
      404
    );
  }


  return rows[0];
}


async function verificarSucursalSinGerente(
  client,
  sucursalId,
  usuarioGerenteActualId = null
) {

  const { rows } =
    await client.query(
      `
        SELECT id
        FROM indigo_usuarios
        WHERE sucursal_id = $1
          AND rol = 'gerente_sucursal'
          AND activo = TRUE
          AND (
            $2::uuid IS NULL
            OR id <> $2
          )
        LIMIT 1
      `,
      [
        sucursalId,
        usuarioGerenteActualId,
      ]
    );


  if (rows[0]) {
    lanzarError(
      "Esa sucursal ya tiene un gerente asignado.",
      400
    );
  }
}


async function crearSucursalEnTransaccion(
  client,
  nombre
) {

  const nombreNormalizado =
    String(nombre ?? "").trim();


  if (!nombreNormalizado) {
    lanzarError(
      "El nombre de la nueva sucursal es obligatorio."
    );
  }


  const { rows: existente } =
    await client.query(
      `
        SELECT id
        FROM indigo_sucursales
        WHERE LOWER(TRIM(nombre)) =
              LOWER(TRIM($1))
        LIMIT 1
      `,
      [nombreNormalizado]
    );


  if (existente[0]) {
    lanzarError(
      "Ya existe una sucursal con ese nombre.",
      409
    );
  }


  const { rows } =
    await client.query(
      `
        INSERT INTO indigo_sucursales (
          nombre
        )
        VALUES ($1)
        RETURNING
          id,
          nombre,
          direccion,
          telefono,
          activo
      `,
      [nombreNormalizado]
    );


  return rows[0];
}


async function crearCredencialUsuario(
  client,
  prefijo
) {

  const credencial =
    await generarCredencialUnica(
      prefijo,
      existeUsuarioGlobal
    );


  return credencial;
}


/* =========================================================
   RESPUESTA PARA FRONTEND
========================================================= */

async function obtenerUsuarioParaFront(
  usuarioId
) {

  const { rows } =
    await pool.query(
      `
        WITH usuarios_numerados AS (
          SELECT
            id,
            ROW_NUMBER() OVER (
              ORDER BY
                created_at ASC,
                id ASC
            ) AS numero
          FROM indigo_usuarios
        )

        SELECT
          u.id,
          un.numero,
          u.nombre,
          u.usuario,
          u.rol,
          u.sucursal_id,
          u.activo,
          s.nombre AS sucursal_nombre

        FROM indigo_usuarios u

        INNER JOIN usuarios_numerados un
          ON un.id = u.id

        LEFT JOIN indigo_sucursales s
          ON s.id = u.sucursal_id

        WHERE u.id = $1
      `,
      [usuarioId]
    );


  if (!rows[0]) {
    return null;
  }


  const user = rows[0];


  return {
    id: user.id,

    displayId:
      Number(user.numero),

    name:
      user.nombre,

    username:
      user.usuario,

    role:
      `indigo:${user.rol}`,

    branchId:
      user.sucursal_id,

    branchName:
      user.sucursal_nombre ??
      "Sin sucursal",

    status:
      user.activo
        ? "active"
        : "inactive",
  };
}


/* =========================================================
   BOOTSTRAP
========================================================= */

async function crearPrimerSuperUsuario({
  nombre,
  usuario,
  password,
}) {

  const {
    rows: existentes,
  } = await pool.query(
    `
      SELECT id
      FROM indigo_usuarios
      WHERE rol = 'super_usuario'
      LIMIT 1
    `
  );


  if (existentes[0]) {
    lanzarError(
      "Ya existe un super usuario. Este endpoint solo funciona la primera vez.",
      403
    );
  }


  const usuarioNormalizado =
    usuario.toUpperCase();


  if (
    await existeUsuarioGlobal(
      usuarioNormalizado
    )
  ) {
    lanzarError(
      "Ese usuario ya existe en el sistema.",
      409
    );
  }


  const passwordHash =
    await bcrypt.hash(
      password,
      SALT_ROUNDS
    );


  const client =
    await pool.connect();


  try {

    await client.query("BEGIN");


    const { rows } =
      await client.query(
        `
          INSERT INTO indigo_usuarios (
            sucursal_id,
            nombre,
            usuario,
            password_hash,
            rol
          )
          VALUES (
            NULL,
            $1,
            $2,
            $3,
            'super_usuario'
          )
          RETURNING
            id,
            nombre,
            usuario,
            rol
        `,
        [
          nombre,
          usuarioNormalizado,
          passwordHash,
        ]
      );


    const nuevo =
      rows[0];


    await registrarCredencialGlobal(
      client,
      {
        usuario:
          usuarioNormalizado,

        tipo:
          "indigo",

        referenciaId:
          nuevo.id,
      }
    );


    await client.query("COMMIT");


    return nuevo;

  } catch (err) {

    await client.query("ROLLBACK");

    throw err;

  } finally {

    client.release();

  }
}


/* =========================================================
   CREAR SUPER USUARIO
========================================================= */

async function crearSuperUsuario({
  nombre,
  creadoPorId,
}) {

  const credencial =
    await crearCredencialUsuario(
      null,
      "SU"
    );


  const passwordHash =
    await bcrypt.hash(
      credencial,
      SALT_ROUNDS
    );


  const client =
    await pool.connect();


  try {

    await client.query("BEGIN");


    const { rows } =
      await client.query(
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
            NULL,
            $1,
            $2,
            $3,
            'super_usuario',
            $4
          )
          RETURNING id
        `,
        [
          nombre,
          credencial,
          passwordHash,
          creadoPorId,
        ]
      );


    const nuevo =
      rows[0];


    await registrarCredencialGlobal(
      client,
      {
        usuario:
          credencial,

        tipo:
          "indigo",

        referenciaId:
          nuevo.id,
      }
    );


    await client.query("COMMIT");


    const usuario =
      await obtenerUsuarioParaFront(
        nuevo.id
      );


    return {
      ...usuario,

      credencial_provisional:
        credencial,
    };

  } catch (err) {

    await client.query("ROLLBACK");

    throw err;

  } finally {

    client.release();

  }
}


/* =========================================================
   CREAR DUEÑO
========================================================= */

async function crearDueno({
  nombre,
  creadoPorId,
}) {

  const credencial =
    await crearCredencialUsuario(
      null,
      "DUE"
    );


  const passwordHash =
    await bcrypt.hash(
      credencial,
      SALT_ROUNDS
    );


  const client =
    await pool.connect();


  try {

    await client.query("BEGIN");


    const { rows } =
      await client.query(
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
            NULL,
            $1,
            $2,
            $3,
            'dueno',
            $4
          )
          RETURNING id
        `,
        [
          nombre,
          credencial,
          passwordHash,
          creadoPorId,
        ]
      );


    const nuevo =
      rows[0];


    await registrarCredencialGlobal(
      client,
      {
        usuario:
          credencial,

        tipo:
          "indigo",

        referenciaId:
          nuevo.id,
      }
    );


    await client.query("COMMIT");


    const usuario =
      await obtenerUsuarioParaFront(
        nuevo.id
      );


    return {
      ...usuario,

      credencial_provisional:
        credencial,
    };

  } catch (err) {

    await client.query("ROLLBACK");

    throw err;

  } finally {

    client.release();

  }
}


/* =========================================================
   CREAR GERENTE
   Puede crear también una nueva sucursal.
========================================================= */

async function crearGerenteSucursal({
  nombre,
  sucursal_id,
  nuevaSucursalNombre,
  creadoPorId,
  creadorRol,
}) {

  validarRolPermitido(
    creadorRol,
    "gerente_sucursal"
  );


  const client =
    await pool.connect();


  try {

    await client.query("BEGIN");


    let sucursalId =
      sucursal_id || null;


    if (nuevaSucursalNombre) {

      if (sucursalId) {
        lanzarError(
          "No puedes seleccionar una sucursal existente y crear una nueva al mismo tiempo."
        );
      }


      const sucursal =
        await crearSucursalEnTransaccion(
          client,
          nuevaSucursalNombre
        );


      sucursalId =
        sucursal.id;
    }


    if (!sucursalId) {
      lanzarError(
        "Debes seleccionar una sucursal o crear una nueva."
      );
    }


    await obtenerSucursal(
      client,
      sucursalId
    );


    await verificarSucursalSinGerente(
      client,
      sucursalId
    );


    const credencial =
      await generarCredencialUnica(
        "GTE",
        existeUsuarioGlobal
      );


    const passwordHash =
      await bcrypt.hash(
        credencial,
        SALT_ROUNDS
      );


    const { rows } =
      await client.query(
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
          RETURNING id
        `,
        [
          sucursalId,
          nombre,
          credencial,
          passwordHash,
          creadoPorId,
        ]
      );


    const nuevo =
      rows[0];


    await registrarCredencialGlobal(
      client,
      {
        usuario:
          credencial,

        tipo:
          "indigo",

        referenciaId:
          nuevo.id,
      }
    );


    await client.query("COMMIT");


    const usuario =
      await obtenerUsuarioParaFront(
        nuevo.id
      );


    return {
      ...usuario,

      credencial_provisional:
        credencial,
    };

  } catch (err) {

    await client.query("ROLLBACK");

    throw err;

  } finally {

    client.release();

  }
}


/* =========================================================
   CREAR EMPLEADO
========================================================= */

async function crearEmpleado({
  nombre,
  tipo,
  sucursalId,
  creadorSucursalId,
  creadoPorId,
  creadorRol,
}) {

  if (
    ![
      "ventas",
      "laboratorio",
    ].includes(tipo)
  ) {
    lanzarError(
      "El tipo de empleado debe ser 'ventas' o 'laboratorio'."
    );
  }


  const rol =
    tipo === "ventas"
      ? "empleado_ventas"
      : "empleado_laboratorio";


  validarRolPermitido(
    creadorRol,
    rol
  );


  let sucursalDestino =
    sucursalId || null;


  /*
   * El gerente únicamente puede crear
   * empleados en su propia sucursal.
   */

  if (
    creadorRol ===
    "gerente_sucursal"
  ) {

    if (!creadorSucursalId) {
      lanzarError(
        "El gerente no tiene una sucursal asignada."
      );
    }


    sucursalDestino =
      creadorSucursalId;
  }


  if (!sucursalDestino) {
    lanzarError(
      "Debes seleccionar una sucursal."
    );
  }


  const client =
    await pool.connect();


  try {

    await client.query("BEGIN");


    await obtenerSucursal(
      client,
      sucursalDestino
    );


    const prefijo =
      tipo === "ventas"
        ? "VTA"
        : "LAB";


    const credencial =
      await generarCredencialUnica(
        prefijo,
        existeUsuarioGlobal
      );


    const passwordHash =
      await bcrypt.hash(
        credencial,
        SALT_ROUNDS
      );


    const { rows } =
      await client.query(
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
            $5,
            $6
          )
          RETURNING id
        `,
        [
          sucursalDestino,
          nombre,
          credencial,
          passwordHash,
          rol,
          creadoPorId,
        ]
      );


    const nuevo =
      rows[0];


    await registrarCredencialGlobal(
      client,
      {
        usuario:
          credencial,

        tipo:
          "indigo",

        referenciaId:
          nuevo.id,
      }
    );


    await client.query("COMMIT");


    const usuario =
      await obtenerUsuarioParaFront(
        nuevo.id
      );


    return {
      ...usuario,

      credencial_provisional:
        credencial,
    };

  } catch (err) {

    await client.query("ROLLBACK");

    throw err;

  } finally {

    client.release();

  }
}


/* =========================================================
   OPCIONES PARA EL FORMULARIO
========================================================= */

async function obtenerOpcionesFormulario({
  creadorRol,
  creadorSucursalId,
  usuarioEditarId = null,
}) {

  const roles = {
    super_usuario: [
      {
        value: "INDIGO_SUPER_USUARIO",
        label: "Super usuario",
      },
      {
        value: "INDIGO_OWNER",
        label: "Dueño Indigo",
      },
      {
        value: "INDIGO_BRANCH_MANAGER",
        label: "Gerente de sucursal",
      },
      {
        value: "INDIGO_SALES",
        label: "Ventas",
      },
      {
        value: "INDIGO_LAB",
        label: "Laboratorio",
      },
    ],

    dueno: [
      {
        value: "INDIGO_BRANCH_MANAGER",
        label: "Gerente de sucursal",
      },
      {
        value: "INDIGO_SALES",
        label: "Ventas",
      },
      {
        value: "INDIGO_LAB",
        label: "Laboratorio",
      },
    ],

    gerente_sucursal: [
      {
        value: "INDIGO_SALES",
        label: "Ventas",
      },
      {
        value: "INDIGO_LAB",
        label: "Laboratorio",
      },
    ],
  };


  let sucursales = [];


  /*
   * Para gerente solamente se muestra
   * su propia sucursal.
   */

  if (
    creadorRol ===
    "gerente_sucursal"
  ) {

    if (creadorSucursalId) {

      const { rows } =
        await pool.query(
          `
            SELECT
              id,
              nombre
            FROM indigo_sucursales
            WHERE id = $1
              AND activo = TRUE
          `,
          [creadorSucursalId]
        );


      sucursales =
        rows.map(
          (row) => ({
            value:
              row.id,

            label:
              row.nombre,
          })
        );
    }

  } else {

    /*
     * Dueño y super usuario pueden
     * utilizar cualquier sucursal activa.
     */

    const { rows } =
      await pool.query(
        `
          SELECT
            id,
            nombre
          FROM indigo_sucursales
          WHERE activo = TRUE
          ORDER BY
            created_at ASC,
            id ASC
        `
      );


    sucursales =
      rows.map(
        (row) => ({
          value:
            row.id,

          label:
            row.nombre,
        })
      );
  }


  /*
   * Sucursales disponibles específicamente
   * para convertir/crear un gerente.
   *
   * Se incluyen sucursales sin gerente.
   *
   * Si estamos editando un gerente, también
   * se incluye su sucursal actual.
   */

  let sucursalesGerente = [];


  if (
    creadorRol === "super_usuario" ||
    creadorRol === "dueno"
  ) {

    const { rows } =
      await pool.query(
        `
          SELECT
            s.id,
            s.nombre

          FROM indigo_sucursales s

          LEFT JOIN indigo_usuarios g
            ON g.sucursal_id = s.id
            AND g.rol = 'gerente_sucursal'
            AND g.activo = TRUE
            AND (
              $1::uuid IS NULL
              OR g.id <> $1
            )

          WHERE s.activo = TRUE
            AND g.id IS NULL

          ORDER BY
            s.created_at ASC,
            s.id ASC
        `,
        [usuarioEditarId]
      );


    sucursalesGerente =
      rows.map(
        (row) => ({
          value:
            row.id,

          label:
            row.nombre,
        })
      );
  }


  return {
    roles:
      roles[creadorRol] ?? [],

    sucursales,

    sucursalesGerente,
  };
}


/* =========================================================
   OBTENER USUARIOS
========================================================= */

async function obtenerUsuarios({
  rol,
  sucursalId,
  usuarioId,
}) {

  let query = `
    SELECT
      u.id,

      ROW_NUMBER() OVER (
        ORDER BY
          u.created_at ASC,
          u.id ASC
      ) AS numero,

      u.nombre,
      u.usuario,
      u.rol,
      u.sucursal_id,
      u.activo,
      u.created_at,

      s.nombre AS sucursal_nombre

    FROM indigo_usuarios u

    LEFT JOIN indigo_sucursales s
      ON s.id = u.sucursal_id
  `;


  const params = [];

  const conditions = [];


  if (rol === "dueno") {

    conditions.push(`
      u.rol NOT IN (
        'super_usuario',
        'dueno'
      )
    `);


    conditions.push(`
      u.id <> $${params.length + 1}
    `);


    params.push(usuarioId);
  }


  if (
    rol ===
    "gerente_sucursal"
  ) {

    conditions.push(`
      u.sucursal_id =
      $${params.length + 1}
    `);


    params.push(
      sucursalId
    );


    conditions.push(`
      u.rol IN (
        'empleado_ventas',
        'empleado_laboratorio'
      )
    `);
  }


  if (conditions.length > 0) {

    query += `
      WHERE
        ${conditions.join(" AND ")}
    `;
  }


  query += `
    ORDER BY
      u.created_at ASC,
      u.id ASC
  `;


  const { rows } =
    await pool.query(
      query,
      params
    );


  return rows.map(
    (user) => ({
      id:
        user.id,

      displayId:
        Number(user.numero),

      name:
        user.nombre,

      username:
        user.usuario,

      role:
        `indigo:${user.rol}`,

      branchId:
        user.sucursal_id,

      branchName:
        user.sucursal_nombre ??
        "Sin sucursal",

      status:
        user.activo
          ? "active"
          : "inactive",
    })
  );
}


/* =========================================================
   ACTUALIZAR USUARIO
========================================================= */

async function actualizarUsuario({
  usuarioId,
  rolNuevo,
  sucursalId,
  nuevaSucursalNombre,
  creadorRol,
  creadorSucursalId,
}) {

  const client =
    await pool.connect();


  try {

    await client.query("BEGIN");


    const { rows } =
      await client.query(
        `
          SELECT
            id,
            nombre,
            rol,
            sucursal_id,
            activo
          FROM indigo_usuarios
          WHERE id = $1
          FOR UPDATE
        `,
        [usuarioId]
      );


    const usuario =
      rows[0];


    if (!usuario) {
      lanzarError(
        "El usuario no existe.",
        404
      );
    }


    if (!usuario.activo) {
      lanzarError(
        "No puedes editar un usuario inactivo."
      );
    }


    validarRolPermitido(
      creadorRol,
      rolNuevo
    );


    /*
     * Nadie puede modificar a un super usuario
     * o dueño salvo las reglas superiores.
     */

    if (
      creadorRol === "dueno" &&
      [
        "super_usuario",
        "dueno",
      ].includes(usuario.rol)
    ) {
      lanzarError(
        "No tienes permiso para editar este usuario.",
        403
      );
    }


    if (
      creadorRol ===
      "gerente_sucursal"
    ) {

      if (
        ![
          "empleado_ventas",
          "empleado_laboratorio",
        ].includes(usuario.rol)
      ) {
        lanzarError(
          "No tienes permiso para editar este usuario.",
          403
        );
      }


      if (
        usuario.sucursal_id !==
        creadorSucursalId
      ) {
        lanzarError(
          "Solo puedes editar usuarios de tu sucursal.",
          403
        );
      }
    }


    let sucursalDestino =
      sucursalId || null;


    /*
     * Si el nuevo rol es gerente,
     * la sucursal debe estar libre o
     * ser la actual del mismo usuario.
     */

    if (
      rolNuevo ===
      "gerente_sucursal"
    ) {

      if (nuevaSucursalNombre) {

        if (sucursalDestino) {
          lanzarError(
            "No puedes seleccionar una sucursal existente y crear una nueva al mismo tiempo."
          );
        }


        const nuevaSucursal =
          await crearSucursalEnTransaccion(
            client,
            nuevaSucursalNombre
          );


        sucursalDestino =
          nuevaSucursal.id;

      }


      if (!sucursalDestino) {
        lanzarError(
          "Debes seleccionar una sucursal o crear una nueva."
        );
      }


      await obtenerSucursal(
        client,
        sucursalDestino
      );


      await verificarSucursalSinGerente(
        client,
        sucursalDestino,
        usuario.id
      );
    }


    /*
     * Los empleados necesitan sucursal.
     */

    if (
      rolNuevo ===
        "empleado_ventas" ||
      rolNuevo ===
        "empleado_laboratorio"
    ) {

      if (
        creadorRol ===
        "gerente_sucursal"
      ) {

        sucursalDestino =
          creadorSucursalId;

      }


      if (!sucursalDestino) {
        lanzarError(
          "Debes seleccionar una sucursal."
        );
      }


      await obtenerSucursal(
        client,
        sucursalDestino
      );
    }


    /*
     * Super usuario y dueño no necesitan
     * sucursal.
     */

    if (
      rolNuevo === "super_usuario" ||
      rolNuevo === "dueno"
    ) {
      sucursalDestino = null;
    }


    /*
     * El gerente no puede cambiar el nombre.
     * Tampoco actualizamos usuario/credencial.
     * Solamente rol y sucursal.
     */

    await client.query(
      `
        UPDATE indigo_usuarios
        SET
          rol = $1,
          sucursal_id = $2,
          updated_at = NOW()
        WHERE id = $3
      `,
      [
        rolNuevo,
        sucursalDestino,
        usuarioId,
      ]
    );


    await client.query("COMMIT");


    return await obtenerUsuarioParaFront(
      usuarioId
    );

  } catch (err) {

    await client.query("ROLLBACK");

    throw err;

  } finally {

    client.release();

  }
}


/* =========================================================
   DAR DE BAJA
========================================================= */

async function darDeBajaUsuario({
  usuarioId,
  creadorRol,
  creadorSucursalId,
}) {

  const client =
    await pool.connect();


  try {

    await client.query("BEGIN");


    const { rows } =
      await client.query(
        `
          SELECT
            id,
            rol,
            sucursal_id,
            activo
          FROM indigo_usuarios
          WHERE id = $1
          FOR UPDATE
        `,
        [usuarioId]
      );


    const usuario =
      rows[0];


    if (!usuario) {
      lanzarError(
        "El usuario no existe.",
        404
      );
    }


    if (!usuario.activo) {
      lanzarError(
        "El usuario ya está inactivo."
      );
    }


    if (
      creadorRol === "dueno" &&
      [
        "super_usuario",
        "dueno",
      ].includes(usuario.rol)
    ) {
      lanzarError(
        "No tienes permiso para dar de baja este usuario.",
        403
      );
    }


    if (
      creadorRol ===
      "gerente_sucursal"
    ) {

      if (
        ![
          "empleado_ventas",
          "empleado_laboratorio",
        ].includes(usuario.rol)
      ) {
        lanzarError(
          "No tienes permiso para dar de baja este usuario.",
          403
        );
      }


      if (
        usuario.sucursal_id !==
        creadorSucursalId
      ) {
        lanzarError(
          "Solo puedes dar de baja usuarios de tu sucursal.",
          403
        );
      }
    }


    /*
     * Nunca se permite dar de baja al propio usuario.
     */

    if (
      usuarioId ===
      creadorSucursalId
    ) {
      lanzarError(
        "No puedes dar de baja tu propio usuario.",
        403
      );
    }


    await client.query(
      `
        UPDATE indigo_usuarios
        SET
          activo = FALSE,
          updated_at = NOW()
        WHERE id = $1
      `,
      [usuarioId]
    );


    await client.query("COMMIT");


    return await obtenerUsuarioParaFront(
      usuarioId
    );

  } catch (err) {

    await client.query("ROLLBACK");

    throw err;

  } finally {

    client.release();

  }
}


async function darDeAltaUsuario({
  usuarioId,
  creadorRol,
  creadorSucursalId,
}) {

  const client =
    await pool.connect();


  try {

    await client.query("BEGIN");


    const { rows } =
      await client.query(
        `
          SELECT
            id,
            rol,
            sucursal_id,
            activo
          FROM indigo_usuarios
          WHERE id = $1
          FOR UPDATE
        `,
        [usuarioId]
      );


    const usuario =
      rows[0];


    if (!usuario) {
      lanzarError(
        "El usuario no existe.",
        404
      );
    }


    if (usuario.activo) {
      lanzarError(
        "El usuario ya está activo."
      );
    }


    if (
      creadorRol === "dueno" &&
      [
        "super_usuario",
        "dueno",
      ].includes(usuario.rol)
    ) {
      lanzarError(
        "No tienes permiso para dar de alta este usuario.",
        403
      );
    }


    if (
      creadorRol ===
      "gerente_sucursal"
    ) {

      if (
        ![
          "empleado_ventas",
          "empleado_laboratorio",
        ].includes(usuario.rol)
      ) {
        lanzarError(
          "No tienes permiso para dar de alta este usuario.",
          403
        );
      }


      if (
        usuario.sucursal_id !==
        creadorSucursalId
      ) {
        lanzarError(
          "Solo puedes dar de alta usuarios de tu sucursal.",
          403
        );
      }
    }


    await client.query(
      `
        UPDATE indigo_usuarios
        SET
          activo = TRUE,
          updated_at = NOW()
        WHERE id = $1
      `,
      [usuarioId]
    );


    await client.query("COMMIT");


    return await obtenerUsuarioParaFront(
      usuarioId
    );

  } catch (err) {

    await client.query("ROLLBACK");

    throw err;

  } finally {

    client.release();

  }
}


module.exports = {
  crearPrimerSuperUsuario,
  crearSuperUsuario,
  crearDueno,
  crearGerenteSucursal,
  crearEmpleado,
  obtenerUsuarios,
  obtenerOpcionesFormulario,
  actualizarUsuario,
  darDeBajaUsuario,
  darDeAltaUsuario,
};

