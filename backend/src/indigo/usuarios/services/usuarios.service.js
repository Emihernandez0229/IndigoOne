
// const bcrypt = require("bcrypt");

// const pool = require("../../../config/db");

// const {
//   generarCredencialUnica,
// } = require("../../../core/utils/credenciales");

// const {
//   existeUsuarioGlobal,
//   registrarCredencialGlobal,
// } = require("../../../core/services/credenciales.service");


// const SALT_ROUNDS = 10;


// /* =========================================================
//    UTILIDADES
// ========================================================= */

// function lanzarError(mensaje, status = 400) {
//   const err = new Error(mensaje);
//   err.status = status;
//   throw err;
// }


// function validarRolPermitido(creadorRol, rolNuevo) {

//   const permisos = {
//     super_usuario: [
//       "super_usuario",
//       "dueno",
//       "gerente_sucursal",
//       "empleado_ventas",
//       "empleado_laboratorio",
//     ],

//     dueno: [
//       "gerente_sucursal",
//       "empleado_ventas",
//       "empleado_laboratorio",
//     ],

//     gerente_sucursal: [
//       "empleado_ventas",
//       "empleado_laboratorio",
//     ],
//   };


//   const rolesPermitidos =
//     permisos[creadorRol] ?? [];


//   if (!rolesPermitidos.includes(rolNuevo)) {
//     lanzarError(
//       "No tienes permiso para crear o asignar ese rol.",
//       403
//     );
//   }
// }


// async function obtenerSucursal(client, sucursalId) {

//   const { rows } =
//     await client.query(
//       `
//         SELECT
//           id,
//           nombre,
//           activo
//         FROM indigo_sucursales
//         WHERE id = $1
//           AND activo = TRUE
//       `,
//       [sucursalId]
//     );


//   if (!rows[0]) {
//     lanzarError(
//       "La sucursal indicada no existe.",
//       404
//     );
//   }


//   return rows[0];
// }


// async function verificarSucursalSinGerente(
//   client,
//   sucursalId,
//   usuarioGerenteActualId = null
// ) {

//   const { rows } =
//     await client.query(
//       `
//         SELECT id
//         FROM indigo_usuarios
//         WHERE sucursal_id = $1
//           AND rol = 'gerente_sucursal'
//           AND activo = TRUE
//           AND (
//             $2::uuid IS NULL
//             OR id <> $2
//           )
//         LIMIT 1
//       `,
//       [
//         sucursalId,
//         usuarioGerenteActualId,
//       ]
//     );


//   if (rows[0]) {
//     lanzarError(
//       "Esa sucursal ya tiene un gerente asignado.",
//       400
//     );
//   }
// }


// async function crearSucursalEnTransaccion(
//   client,
//   nombre
// ) {

//   const nombreNormalizado =
//     String(nombre ?? "").trim();


//   if (!nombreNormalizado) {
//     lanzarError(
//       "El nombre de la nueva sucursal es obligatorio."
//     );
//   }


//   const { rows: existente } =
//     await client.query(
//       `
//         SELECT id
//         FROM indigo_sucursales
//         WHERE LOWER(TRIM(nombre)) =
//               LOWER(TRIM($1))
//         LIMIT 1
//       `,
//       [nombreNormalizado]
//     );


//   if (existente[0]) {
//     lanzarError(
//       "Ya existe una sucursal con ese nombre.",
//       409
//     );
//   }


//   const { rows } =
//     await client.query(
//       `
//         INSERT INTO indigo_sucursales (
//           nombre
//         )
//         VALUES ($1)
//         RETURNING
//           id,
//           nombre,
//           direccion,
//           telefono,
//           activo
//       `,
//       [nombreNormalizado]
//     );


//   return rows[0];
// }


// async function crearCredencialUsuario(
//   client,
//   prefijo
// ) {

//   const credencial =
//     await generarCredencialUnica(
//       prefijo,
//       existeUsuarioGlobal
//     );


//   return credencial;
// }


// /* =========================================================
//    RESPUESTA PARA FRONTEND
// ========================================================= */

// async function obtenerUsuarioParaFront(
//   usuarioId
// ) {

//   const { rows } =
//     await pool.query(
//       `
//         WITH usuarios_numerados AS (
//           SELECT
//             id,
//             ROW_NUMBER() OVER (
//               ORDER BY
//                 created_at ASC,
//                 id ASC
//             ) AS numero
//           FROM indigo_usuarios
//         )

//         SELECT
//           u.id,
//           un.numero,
//           u.nombre,
//           u.usuario,
//           u.rol,
//           u.sucursal_id,
//           u.activo,
//           s.nombre AS sucursal_nombre

//         FROM indigo_usuarios u

//         INNER JOIN usuarios_numerados un
//           ON un.id = u.id

//         LEFT JOIN indigo_sucursales s
//           ON s.id = u.sucursal_id

//         WHERE u.id = $1
//       `,
//       [usuarioId]
//     );


//   if (!rows[0]) {
//     return null;
//   }


//   const user = rows[0];


//   return {
//     id: user.id,

//     displayId:
//       Number(user.numero),

//     name:
//       user.nombre,

//     username:
//       user.usuario,

//     role:
//       `indigo:${user.rol}`,

//     branchId:
//       user.sucursal_id,

//     branchName:
//       user.sucursal_nombre ??
//       "Sin sucursal",

//     status:
//       user.activo
//         ? "active"
//         : "inactive",
//   };
// }


// /* =========================================================
//    BOOTSTRAP
// ========================================================= */

// async function crearPrimerSuperUsuario({
//   nombre,
//   usuario,
//   password,
// }) {

//   const {
//     rows: existentes,
//   } = await pool.query(
//     `
//       SELECT id
//       FROM indigo_usuarios
//       WHERE rol = 'super_usuario'
//       LIMIT 1
//     `
//   );


//   if (existentes[0]) {
//     lanzarError(
//       "Ya existe un super usuario. Este endpoint solo funciona la primera vez.",
//       403
//     );
//   }


//   const usuarioNormalizado =
//     usuario.toUpperCase();


//   if (
//     await existeUsuarioGlobal(
//       usuarioNormalizado
//     )
//   ) {
//     lanzarError(
//       "Ese usuario ya existe en el sistema.",
//       409
//     );
//   }


//   const passwordHash =
//     await bcrypt.hash(
//       password,
//       SALT_ROUNDS
//     );


//   const client =
//     await pool.connect();


//   try {

//     await client.query("BEGIN");


//     const { rows } =
//       await client.query(
//         `
//           INSERT INTO indigo_usuarios (
//             sucursal_id,
//             nombre,
//             usuario,
//             password_hash,
//             rol
//           )
//           VALUES (
//             NULL,
//             $1,
//             $2,
//             $3,
//             'super_usuario'
//           )
//           RETURNING
//             id,
//             nombre,
//             usuario,
//             rol
//         `,
//         [
//           nombre,
//           usuarioNormalizado,
//           passwordHash,
//         ]
//       );


//     const nuevo =
//       rows[0];


//     await registrarCredencialGlobal(
//       client,
//       {
//         usuario:
//           usuarioNormalizado,

//         tipo:
//           "indigo",

//         referenciaId:
//           nuevo.id,
//       }
//     );


//     await client.query("COMMIT");


//     return nuevo;

//   } catch (err) {

//     await client.query("ROLLBACK");

//     throw err;

//   } finally {

//     client.release();

//   }
// }


// /* =========================================================
//    CREAR SUPER USUARIO
// ========================================================= */

// async function crearSuperUsuario({
//   nombre,
//   creadoPorId,
// }) {

//   const credencial =
//     await crearCredencialUsuario(
//       null,
//       "SU"
//     );


//   const passwordHash =
//     await bcrypt.hash(
//       credencial,
//       SALT_ROUNDS
//     );


//   const client =
//     await pool.connect();


//   try {

//     await client.query("BEGIN");


//     const { rows } =
//       await client.query(
//         `
//           INSERT INTO indigo_usuarios (
//             sucursal_id,
//             nombre,
//             usuario,
//             password_hash,
//             rol,
//             dado_de_alta_por
//           )
//           VALUES (
//             NULL,
//             $1,
//             $2,
//             $3,
//             'super_usuario',
//             $4
//           )
//           RETURNING id
//         `,
//         [
//           nombre,
//           credencial,
//           passwordHash,
//           creadoPorId,
//         ]
//       );


//     const nuevo =
//       rows[0];


//     await registrarCredencialGlobal(
//       client,
//       {
//         usuario:
//           credencial,

//         tipo:
//           "indigo",

//         referenciaId:
//           nuevo.id,
//       }
//     );


//     await client.query("COMMIT");


//     const usuario =
//       await obtenerUsuarioParaFront(
//         nuevo.id
//       );


//     return {
//       ...usuario,

//       credencial_provisional:
//         credencial,
//     };

//   } catch (err) {

//     await client.query("ROLLBACK");

//     throw err;

//   } finally {

//     client.release();

//   }
// }


// /* =========================================================
//    CREAR DUEÑO
// ========================================================= */

// async function crearDueno({
//   nombre,
//   creadoPorId,
// }) {

//   const credencial =
//     await crearCredencialUsuario(
//       null,
//       "DUE"
//     );


//   const passwordHash =
//     await bcrypt.hash(
//       credencial,
//       SALT_ROUNDS
//     );


//   const client =
//     await pool.connect();


//   try {

//     await client.query("BEGIN");


//     const { rows } =
//       await client.query(
//         `
//           INSERT INTO indigo_usuarios (
//             sucursal_id,
//             nombre,
//             usuario,
//             password_hash,
//             rol,
//             dado_de_alta_por
//           )
//           VALUES (
//             NULL,
//             $1,
//             $2,
//             $3,
//             'dueno',
//             $4
//           )
//           RETURNING id
//         `,
//         [
//           nombre,
//           credencial,
//           passwordHash,
//           creadoPorId,
//         ]
//       );


//     const nuevo =
//       rows[0];


//     await registrarCredencialGlobal(
//       client,
//       {
//         usuario:
//           credencial,

//         tipo:
//           "indigo",

//         referenciaId:
//           nuevo.id,
//       }
//     );


//     await client.query("COMMIT");


//     const usuario =
//       await obtenerUsuarioParaFront(
//         nuevo.id
//       );


//     return {
//       ...usuario,

//       credencial_provisional:
//         credencial,
//     };

//   } catch (err) {

//     await client.query("ROLLBACK");

//     throw err;

//   } finally {

//     client.release();

//   }
// }


// /* =========================================================
//    CREAR GERENTE
//    Puede crear también una nueva sucursal.
// ========================================================= */

// async function crearGerenteSucursal({
//   nombre,
//   sucursal_id,
//   nuevaSucursalNombre,
//   creadoPorId,
//   creadorRol,
// }) {

//   validarRolPermitido(
//     creadorRol,
//     "gerente_sucursal"
//   );


//   const client =
//     await pool.connect();


//   try {

//     await client.query("BEGIN");


//     let sucursalId =
//       sucursal_id || null;


//     if (nuevaSucursalNombre) {

//       if (sucursalId) {
//         lanzarError(
//           "No puedes seleccionar una sucursal existente y crear una nueva al mismo tiempo."
//         );
//       }


//       const sucursal =
//         await crearSucursalEnTransaccion(
//           client,
//           nuevaSucursalNombre
//         );


//       sucursalId =
//         sucursal.id;
//     }


//     if (!sucursalId) {
//       lanzarError(
//         "Debes seleccionar una sucursal o crear una nueva."
//       );
//     }


//     await obtenerSucursal(
//       client,
//       sucursalId
//     );


//     await verificarSucursalSinGerente(
//       client,
//       sucursalId
//     );


//     const credencial =
//       await generarCredencialUnica(
//         "GTE",
//         existeUsuarioGlobal
//       );


//     const passwordHash =
//       await bcrypt.hash(
//         credencial,
//         SALT_ROUNDS
//       );


//     const { rows } =
//       await client.query(
//         `
//           INSERT INTO indigo_usuarios (
//             sucursal_id,
//             nombre,
//             usuario,
//             password_hash,
//             rol,
//             dado_de_alta_por
//           )
//           VALUES (
//             $1,
//             $2,
//             $3,
//             $4,
//             'gerente_sucursal',
//             $5
//           )
//           RETURNING id
//         `,
//         [
//           sucursalId,
//           nombre,
//           credencial,
//           passwordHash,
//           creadoPorId,
//         ]
//       );


//     const nuevo =
//       rows[0];


//     await registrarCredencialGlobal(
//       client,
//       {
//         usuario:
//           credencial,

//         tipo:
//           "indigo",

//         referenciaId:
//           nuevo.id,
//       }
//     );


//     await client.query("COMMIT");


//     const usuario =
//       await obtenerUsuarioParaFront(
//         nuevo.id
//       );


//     return {
//       ...usuario,

//       credencial_provisional:
//         credencial,
//     };

//   } catch (err) {

//     await client.query("ROLLBACK");

//     throw err;

//   } finally {

//     client.release();

//   }
// }


// /* =========================================================
//    CREAR EMPLEADO
// ========================================================= */

// async function crearEmpleado({
//   nombre,
//   tipo,
//   sucursalId,
//   creadorSucursalId,
//   creadoPorId,
//   creadorRol,
// }) {

//   if (
//     ![
//       "ventas",
//       "laboratorio",
//     ].includes(tipo)
//   ) {
//     lanzarError(
//       "El tipo de empleado debe ser 'ventas' o 'laboratorio'."
//     );
//   }


//   const rol =
//     tipo === "ventas"
//       ? "empleado_ventas"
//       : "empleado_laboratorio";


//   validarRolPermitido(
//     creadorRol,
//     rol
//   );


//   let sucursalDestino =
//     sucursalId || null;


//   /*
//    * El gerente únicamente puede crear
//    * empleados en su propia sucursal.
//    */

//   if (
//     creadorRol ===
//     "gerente_sucursal"
//   ) {

//     if (!creadorSucursalId) {
//       lanzarError(
//         "El gerente no tiene una sucursal asignada."
//       );
//     }


//     sucursalDestino =
//       creadorSucursalId;
//   }


//   if (!sucursalDestino) {
//     lanzarError(
//       "Debes seleccionar una sucursal."
//     );
//   }


//   const client =
//     await pool.connect();


//   try {

//     await client.query("BEGIN");


//     await obtenerSucursal(
//       client,
//       sucursalDestino
//     );


//     const prefijo =
//       tipo === "ventas"
//         ? "VTA"
//         : "LAB";


//     const credencial =
//       await generarCredencialUnica(
//         prefijo,
//         existeUsuarioGlobal
//       );


//     const passwordHash =
//       await bcrypt.hash(
//         credencial,
//         SALT_ROUNDS
//       );


//     const { rows } =
//       await client.query(
//         `
//           INSERT INTO indigo_usuarios (
//             sucursal_id,
//             nombre,
//             usuario,
//             password_hash,
//             rol,
//             dado_de_alta_por
//           )
//           VALUES (
//             $1,
//             $2,
//             $3,
//             $4,
//             $5,
//             $6
//           )
//           RETURNING id
//         `,
//         [
//           sucursalDestino,
//           nombre,
//           credencial,
//           passwordHash,
//           rol,
//           creadoPorId,
//         ]
//       );


//     const nuevo =
//       rows[0];


//     await registrarCredencialGlobal(
//       client,
//       {
//         usuario:
//           credencial,

//         tipo:
//           "indigo",

//         referenciaId:
//           nuevo.id,
//       }
//     );


//     await client.query("COMMIT");


//     const usuario =
//       await obtenerUsuarioParaFront(
//         nuevo.id
//       );


//     return {
//       ...usuario,

//       credencial_provisional:
//         credencial,
//     };

//   } catch (err) {

//     await client.query("ROLLBACK");

//     throw err;

//   } finally {

//     client.release();

//   }
// }


// /* =========================================================
//    OPCIONES PARA EL FORMULARIO
// ========================================================= */

// async function obtenerOpcionesFormulario({
//   creadorRol,
//   creadorSucursalId,
//   usuarioEditarId = null,
// }) {

//   // const roles = {
//   //   super_usuario: [
//   //     {
//   //       value: "INDIGO_SUPER_USUARIO",
//   //       label: "Super usuario",
//   //     },
//   //     {
//   //       value: "INDIGO_OWNER",
//   //       label: "Dueño Indigo",
//   //     },
//   //     {
//   //       value: "INDIGO_BRANCH_MANAGER",
//   //       label: "Gerente de sucursal",
//   //     },
//   //     {
//   //       value: "INDIGO_SALES",
//   //       label: "Ventas",
//   //     },
//   //     {
//   //       value: "INDIGO_LAB",
//   //       label: "Laboratorio",
//   //     },
//   //   ],

//   //   dueno: [
//   //     {
//   //       value: "INDIGO_BRANCH_MANAGER",
//   //       label: "Gerente de sucursal",
//   //     },
//   //     {
//   //       value: "INDIGO_SALES",
//   //       label: "Ventas",
//   //     },
//   //     {
//   //       value: "INDIGO_LAB",
//   //       label: "Laboratorio",
//   //     },
//   //   ],

//   //   gerente_sucursal: [
//   //     {
//   //       value: "INDIGO_SALES",
//   //       label: "Ventas",
//   //     },
//   //     {
//   //       value: "INDIGO_LAB",
//   //       label: "Laboratorio",
//   //     },
//   //   ],
//   // };


//   const roles = {
//   super_usuario: [
//     { value: "super_usuario", label: "Super usuario" },
//     { value: "dueno", label: "Dueño Indigo" },
//     { value: "gerente_sucursal", label: "Gerente de sucursal" },
//     { value: "empleado_ventas", label: "Ventas" },
//     { value: "empleado_laboratorio", label: "Laboratorio" },
//   ],
 
//   dueno: [
//     { value: "gerente_sucursal", label: "Gerente de sucursal" },
//     { value: "empleado_ventas", label: "Ventas" },
//     { value: "empleado_laboratorio", label: "Laboratorio" },
//   ],
 
//   gerente_sucursal: [
//     { value: "empleado_ventas", label: "Ventas" },
//     { value: "empleado_laboratorio", label: "Laboratorio" },
//   ],
// };



//   let sucursales = [];


//   /*
//    * Para gerente solamente se muestra
//    * su propia sucursal.
//    */

//   if (
//     creadorRol ===
//     "gerente_sucursal"
//   ) {

//     if (creadorSucursalId) {

//       const { rows } =
//         await pool.query(
//           `
//             SELECT
//               id,
//               nombre
//             FROM indigo_sucursales
//             WHERE id = $1
//               AND activo = TRUE
//           `,
//           [creadorSucursalId]
//         );


//       sucursales =
//         rows.map(
//           (row) => ({
//             value:
//               row.id,

//             label:
//               row.nombre,
//           })
//         );
//     }

//   } else {

//     /*
//      * Dueño y super usuario pueden
//      * utilizar cualquier sucursal activa.
//      */

//     const { rows } =
//       await pool.query(
//         `
//           SELECT
//             id,
//             nombre
//           FROM indigo_sucursales
//           WHERE activo = TRUE
//           ORDER BY
//             created_at ASC,
//             id ASC
//         `
//       );


//     sucursales =
//       rows.map(
//         (row) => ({
//           value:
//             row.id,

//           label:
//             row.nombre,
//         })
//       );
//   }


//   /*
//    * Sucursales disponibles específicamente
//    * para convertir/crear un gerente.
//    *
//    * Se incluyen sucursales sin gerente.
//    *
//    * Si estamos editando un gerente, también
//    * se incluye su sucursal actual.
//    */

//   let sucursalesGerente = [];


//   if (
//     creadorRol === "super_usuario" ||
//     creadorRol === "dueno"
//   ) {

//     const { rows } =
//       await pool.query(
//         `
//           SELECT
//             s.id,
//             s.nombre

//           FROM indigo_sucursales s

//           LEFT JOIN indigo_usuarios g
//             ON g.sucursal_id = s.id
//             AND g.rol = 'gerente_sucursal'
//             AND g.activo = TRUE
//             AND (
//               $1::uuid IS NULL
//               OR g.id <> $1
//             )

//           WHERE s.activo = TRUE
//             AND g.id IS NULL

//           ORDER BY
//             s.created_at ASC,
//             s.id ASC
//         `,
//         [usuarioEditarId]
//       );


//     sucursalesGerente =
//       rows.map(
//         (row) => ({
//           value:
//             row.id,

//           label:
//             row.nombre,
//         })
//       );
//   }


//   return {
//     roles:
//       roles[creadorRol] ?? [],

//     sucursales,

//     sucursalesGerente,
//   };
// }


// /* =========================================================
//    OBTENER USUARIOS
// ========================================================= */

// async function obtenerUsuarios({
//   rol,
//   sucursalId,
//   usuarioId,
// }) {

//   let query = `
//     SELECT
//       u.id,

//       ROW_NUMBER() OVER (
//         ORDER BY
//           u.created_at ASC,
//           u.id ASC
//       ) AS numero,

//       u.nombre,
//       u.usuario,
//       u.rol,
//       u.sucursal_id,
//       u.activo,
//       u.created_at,

//       s.nombre AS sucursal_nombre

//     FROM indigo_usuarios u

//     LEFT JOIN indigo_sucursales s
//       ON s.id = u.sucursal_id
//   `;


//   const params = [];

//   const conditions = [];


//   if (rol === "dueno") {

//     conditions.push(`
//       u.rol NOT IN (
//         'super_usuario',
//         'dueno'
//       )
//     `);


//     conditions.push(`
//       u.id <> $${params.length + 1}
//     `);


//     params.push(usuarioId);
//   }


//   if (
//     rol ===
//     "gerente_sucursal"
//   ) {

//     conditions.push(`
//       u.sucursal_id =
//       $${params.length + 1}
//     `);


//     params.push(
//       sucursalId
//     );


//     conditions.push(`
//       u.rol IN (
//         'empleado_ventas',
//         'empleado_laboratorio'
//       )
//     `);
//   }


//   if (conditions.length > 0) {

//     query += `
//       WHERE
//         ${conditions.join(" AND ")}
//     `;
//   }


//   query += `
//     ORDER BY
//       u.created_at ASC,
//       u.id ASC
//   `;


//   const { rows } =
//     await pool.query(
//       query,
//       params
//     );


//   return rows.map(
//     (user) => ({
//       id:
//         user.id,

//       displayId:
//         Number(user.numero),

//       name:
//         user.nombre,

//       username:
//         user.usuario,

//       role:
//         `indigo:${user.rol}`,

//       branchId:
//         user.sucursal_id,

//       branchName:
//         user.sucursal_nombre ??
//         "Sin sucursal",

//       status:
//         user.activo
//           ? "active"
//           : "inactive",
//     })
//   );
// }


// /* =========================================================
//    ACTUALIZAR USUARIO
// ========================================================= */

// async function actualizarUsuario({
//   usuarioId,
//   rolNuevo,
//   sucursalId,
//   nuevaSucursalNombre,
//   creadorRol,
//   creadorSucursalId,
// }) {

//   const client =
//     await pool.connect();


//   try {

//     await client.query("BEGIN");


//     const { rows } =
//       await client.query(
//         `
//           SELECT
//             id,
//             nombre,
//             rol,
//             sucursal_id,
//             activo
//           FROM indigo_usuarios
//           WHERE id = $1
//           FOR UPDATE
//         `,
//         [usuarioId]
//       );


//     const usuario =
//       rows[0];


//     if (!usuario) {
//       lanzarError(
//         "El usuario no existe.",
//         404
//       );
//     }


//     if (!usuario.activo) {
//       lanzarError(
//         "No puedes editar un usuario inactivo."
//       );
//     }


//     validarRolPermitido(
//       creadorRol,
//       rolNuevo
//     );


//     /*
//      * Nadie puede modificar a un super usuario
//      * o dueño salvo las reglas superiores.
//      */

//     if (
//       creadorRol === "dueno" &&
//       [
//         "super_usuario",
//         "dueno",
//       ].includes(usuario.rol)
//     ) {
//       lanzarError(
//         "No tienes permiso para editar este usuario.",
//         403
//       );
//     }


//     if (
//       creadorRol ===
//       "gerente_sucursal"
//     ) {

//       if (
//         ![
//           "empleado_ventas",
//           "empleado_laboratorio",
//         ].includes(usuario.rol)
//       ) {
//         lanzarError(
//           "No tienes permiso para editar este usuario.",
//           403
//         );
//       }


//       if (
//         usuario.sucursal_id !==
//         creadorSucursalId
//       ) {
//         lanzarError(
//           "Solo puedes editar usuarios de tu sucursal.",
//           403
//         );
//       }
//     }


//     let sucursalDestino =
//       sucursalId || null;


//     /*
//      * Si el nuevo rol es gerente,
//      * la sucursal debe estar libre o
//      * ser la actual del mismo usuario.
//      */

//     if (
//       rolNuevo ===
//       "gerente_sucursal"
//     ) {

//       if (nuevaSucursalNombre) {

//         if (sucursalDestino) {
//           lanzarError(
//             "No puedes seleccionar una sucursal existente y crear una nueva al mismo tiempo."
//           );
//         }


//         const nuevaSucursal =
//           await crearSucursalEnTransaccion(
//             client,
//             nuevaSucursalNombre
//           );


//         sucursalDestino =
//           nuevaSucursal.id;

//       }


//       if (!sucursalDestino) {
//         lanzarError(
//           "Debes seleccionar una sucursal o crear una nueva."
//         );
//       }


//       await obtenerSucursal(
//         client,
//         sucursalDestino
//       );


//       await verificarSucursalSinGerente(
//         client,
//         sucursalDestino,
//         usuario.id
//       );
//     }


//     /*
//      * Los empleados necesitan sucursal.
//      */

//     if (
//       rolNuevo ===
//         "empleado_ventas" ||
//       rolNuevo ===
//         "empleado_laboratorio"
//     ) {

//       if (
//         creadorRol ===
//         "gerente_sucursal"
//       ) {

//         sucursalDestino =
//           creadorSucursalId;

//       }


//       if (!sucursalDestino) {
//         lanzarError(
//           "Debes seleccionar una sucursal."
//         );
//       }


//       await obtenerSucursal(
//         client,
//         sucursalDestino
//       );
//     }


//     /*
//      * Super usuario y dueño no necesitan
//      * sucursal.
//      */

//     if (
//       rolNuevo === "super_usuario" ||
//       rolNuevo === "dueno"
//     ) {
//       sucursalDestino = null;
//     }


//     /*
//      * El gerente no puede cambiar el nombre.
//      * Tampoco actualizamos usuario/credencial.
//      * Solamente rol y sucursal.
//      */

//     await client.query(
//       `
//         UPDATE indigo_usuarios
//         SET
//           rol = $1,
//           sucursal_id = $2,
//           updated_at = NOW()
//         WHERE id = $3
//       `,
//       [
//         rolNuevo,
//         sucursalDestino,
//         usuarioId,
//       ]
//     );


//     await client.query("COMMIT");


//     return await obtenerUsuarioParaFront(
//       usuarioId
//     );

//   } catch (err) {

//     await client.query("ROLLBACK");

//     throw err;

//   } finally {

//     client.release();

//   }
// }


// /* =========================================================
//    DAR DE BAJA
// ========================================================= */

// async function darDeBajaUsuario({
//   usuarioId,
//   creadorRol,
//   creadorSucursalId,
// }) {

//   const client =
//     await pool.connect();


//   try {

//     await client.query("BEGIN");


//     const { rows } =
//       await client.query(
//         `
//           SELECT
//             id,
//             rol,
//             sucursal_id,
//             activo
//           FROM indigo_usuarios
//           WHERE id = $1
//           FOR UPDATE
//         `,
//         [usuarioId]
//       );


//     const usuario =
//       rows[0];


//     if (!usuario) {
//       lanzarError(
//         "El usuario no existe.",
//         404
//       );
//     }


//     if (!usuario.activo) {
//       lanzarError(
//         "El usuario ya está inactivo."
//       );
//     }


//     if (
//       creadorRol === "dueno" &&
//       [
//         "super_usuario",
//         "dueno",
//       ].includes(usuario.rol)
//     ) {
//       lanzarError(
//         "No tienes permiso para dar de baja este usuario.",
//         403
//       );
//     }


//     if (
//       creadorRol ===
//       "gerente_sucursal"
//     ) {

//       if (
//         ![
//           "empleado_ventas",
//           "empleado_laboratorio",
//         ].includes(usuario.rol)
//       ) {
//         lanzarError(
//           "No tienes permiso para dar de baja este usuario.",
//           403
//         );
//       }


//       if (
//         usuario.sucursal_id !==
//         creadorSucursalId
//       ) {
//         lanzarError(
//           "Solo puedes dar de baja usuarios de tu sucursal.",
//           403
//         );
//       }
//     }


//     /*
//      * Nunca se permite dar de baja al propio usuario.
//      */

//     if (
//       usuarioId ===
//       creadorSucursalId
//     ) {
//       lanzarError(
//         "No puedes dar de baja tu propio usuario.",
//         403
//       );
//     }


//     await client.query(
//       `
//         UPDATE indigo_usuarios
//         SET
//           activo = FALSE,
//           updated_at = NOW()
//         WHERE id = $1
//       `,
//       [usuarioId]
//     );


//     await client.query("COMMIT");


//     return await obtenerUsuarioParaFront(
//       usuarioId
//     );

//   } catch (err) {

//     await client.query("ROLLBACK");

//     throw err;

//   } finally {

//     client.release();

//   }
// }


// async function darDeAltaUsuario({
//   usuarioId,
//   creadorRol,
//   creadorSucursalId,
// }) {

//   const client =
//     await pool.connect();


//   try {

//     await client.query("BEGIN");


//     const { rows } =
//       await client.query(
//         `
//           SELECT
//             id,
//             rol,
//             sucursal_id,
//             activo
//           FROM indigo_usuarios
//           WHERE id = $1
//           FOR UPDATE
//         `,
//         [usuarioId]
//       );


//     const usuario =
//       rows[0];


//     if (!usuario) {
//       lanzarError(
//         "El usuario no existe.",
//         404
//       );
//     }


//     if (usuario.activo) {
//       lanzarError(
//         "El usuario ya está activo."
//       );
//     }


//     if (
//       creadorRol === "dueno" &&
//       [
//         "super_usuario",
//         "dueno",
//       ].includes(usuario.rol)
//     ) {
//       lanzarError(
//         "No tienes permiso para dar de alta este usuario.",
//         403
//       );
//     }


//     if (
//       creadorRol ===
//       "gerente_sucursal"
//     ) {

//       if (
//         ![
//           "empleado_ventas",
//           "empleado_laboratorio",
//         ].includes(usuario.rol)
//       ) {
//         lanzarError(
//           "No tienes permiso para dar de alta este usuario.",
//           403
//         );
//       }


//       if (
//         usuario.sucursal_id !==
//         creadorSucursalId
//       ) {
//         lanzarError(
//           "Solo puedes dar de alta usuarios de tu sucursal.",
//           403
//         );
//       }
//     }


//     await client.query(
//       `
//         UPDATE indigo_usuarios
//         SET
//           activo = TRUE,
//           updated_at = NOW()
//         WHERE id = $1
//       `,
//       [usuarioId]
//     );


//     await client.query("COMMIT");


//     return await obtenerUsuarioParaFront(
//       usuarioId
//     );

//   } catch (err) {

//     await client.query("ROLLBACK");

//     throw err;

//   } finally {

//     client.release();

//   }
// }


// module.exports = {
//   crearPrimerSuperUsuario,
//   crearSuperUsuario,
//   crearDueno,
//   crearGerenteSucursal,
//   crearEmpleado,
//   obtenerUsuarios,
//   obtenerOpcionesFormulario,
//   actualizarUsuario,
//   darDeBajaUsuario,
//   darDeAltaUsuario,
// };

const bcrypt = require("bcrypt");

const pool = require("../../../config/db");
const TransactionManager = require("../../../core/database/transaction-manager");
const { generarCredencialUnica } = require("../../../core/utils/credenciales");
const {
  existeUsuarioGlobal,
  registrarCredencialGlobal,
} = require("../../../core/services/credenciales.service");
const {
  AppError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} = require("../../../core/utils/errors");

const usuariosRepo = require("../repositories/usuarios.repository");
const sucursalesRepo = require("../../sucursales/repositories/sucursales.repository");
const { aUsuarioFront } = require("../helpers/usuarios.mapper");
const {
  ROLES,
  PREFIJOS,
  TIPO_EMPLEADO_A_ROL,
  validarRolPermitido,
  validarPuedeGestionar,
  opcionesDeRoles,
} = require("../helpers/usuarios.permisos");

const SALT_ROUNDS = 10;
const tx = new TransactionManager(pool);

/* =========================================================
   HELPERS INTERNOS
========================================================= */

async function exigirSucursalActiva(client, sucursalId) {
  const sucursal = await sucursalesRepo.buscarActivaPorId(sucursalId, client);

  if (!sucursal) {
    throw new AppError("La sucursal indicada no existe.", 404);
  }
  return sucursal;
}

async function crearSucursalNueva(client, nombre) {
  const nombreNormalizado = String(nombre ?? "").trim();

  if (!nombreNormalizado) {
    throw new BadRequestError("El nombre de la nueva sucursal es obligatorio.");
  }

  if (await sucursalesRepo.existePorNombre(nombreNormalizado, client)) {
    throw new ConflictError("Ya existe una sucursal con ese nombre.");
  }

  return sucursalesRepo.crear({ nombre: nombreNormalizado }, client);
}

/*
 * Devuelve el id de sucursal para un gerente: existente o nueva.
 * gerenteId se usa al editar, para ignorar al propio usuario.
 */
async function resolverSucursalGerente(
  client,
  { sucursalId, nuevaSucursalNombre, gerenteId = null }
) {
  let destino = sucursalId || null;

  if (nuevaSucursalNombre) {
    if (destino) {
      throw new BadRequestError(
        "No puedes seleccionar una sucursal existente y crear una nueva al mismo tiempo."
      );
    }
    destino = (await crearSucursalNueva(client, nuevaSucursalNombre)).id;
  }

  if (!destino) {
    throw new BadRequestError("Debes seleccionar una sucursal o crear una nueva.");
  }

  await exigirSucursalActiva(client, destino);

  if (await sucursalesRepo.tieneGerenteActivo(destino, gerenteId, client)) {
    throw new BadRequestError("Esa sucursal ya tiene un gerente asignado.");
  }

  return destino;
}

/*
 * El gerente solo opera en su propia sucursal;
 * los demás roles deben elegir una.
 */
function resolverSucursalEmpleado(actor, sucursalId) {
  if (actor.rol === ROLES.GERENTE) {
    if (!actor.sucursal_id) {
      throw new BadRequestError("El gerente no tiene una sucursal asignada.");
    }
    return actor.sucursal_id;
  }

  if (!sucursalId) {
    throw new BadRequestError("Debes seleccionar una sucursal.");
  }
  return sucursalId;
}

// Genera credencial, inserta el usuario y la registra globalmente
async function crearUsuarioConCredencial(
  client,
  { rol, nombre, sucursalId, creadoPorId }
) {
  const credencial = await generarCredencialUnica(
    PREFIJOS[rol],
    existeUsuarioGlobal
  );

  const passwordHash = await bcrypt.hash(credencial, SALT_ROUNDS);

  const nuevo = await usuariosRepo.insertar(
    { sucursalId, nombre, usuario: credencial, passwordHash, rol, creadoPorId },
    client
  );

  await registrarCredencialGlobal(client, {
    usuario: credencial,
    tipo: "indigo",
    referenciaId: nuevo.id,
  });

  return { id: nuevo.id, credencial };
}

async function respuestaConCredencial({ id, credencial }) {
  const usuario = await usuariosRepo.buscarParaFront(id);

  return {
    ...aUsuarioFront(usuario),
    credencial_provisional: credencial,
  };
}

/* =========================================================
   BOOTSTRAP
========================================================= */

async function crearPrimerSuperUsuario({ nombre, usuario, password }) {
  if (await usuariosRepo.existeSuperUsuario()) {
    throw new ForbiddenError(
      "Ya existe un super usuario. Este endpoint solo funciona la primera vez."
    );
  }

  const usuarioNormalizado = usuario.toUpperCase();

  if (await existeUsuarioGlobal(usuarioNormalizado)) {
    throw new ConflictError("Ese usuario ya existe en el sistema.");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  return tx.ejecutar(async (client) => {
    const nuevo = await usuariosRepo.insertar(
      {
        sucursalId: null,
        nombre,
        usuario: usuarioNormalizado,
        passwordHash,
        rol: ROLES.SUPER_USUARIO,
        creadoPorId: null,
      },
      client
    );

    await registrarCredencialGlobal(client, {
      usuario: usuarioNormalizado,
      tipo: "indigo",
      referenciaId: nuevo.id,
    });

    return nuevo;
  });
}

/* =========================================================
   CREACIÓN
========================================================= */

// Super usuario y dueño: no llevan sucursal
async function crearUsuarioGlobal(actor, rol, { nombre }) {
  const creado = await tx.ejecutar((client) =>
    crearUsuarioConCredencial(client, {
      rol,
      nombre,
      sucursalId: null,
      creadoPorId: actor.id,
    })
  );

  return respuestaConCredencial(creado);
}

const crearSuperUsuario = (actor, datos) =>
  crearUsuarioGlobal(actor, ROLES.SUPER_USUARIO, datos);

const crearDueno = (actor, datos) =>
  crearUsuarioGlobal(actor, ROLES.DUENO, datos);

/* Puede crear también una nueva sucursal */
async function crearGerenteSucursal(
  actor,
  { nombre, sucursalId, nuevaSucursalNombre }
) {
  validarRolPermitido(actor.rol, ROLES.GERENTE);

  const creado = await tx.ejecutar(async (client) => {
    const sucursalDestino = await resolverSucursalGerente(client, {
      sucursalId,
      nuevaSucursalNombre,
    });

    return crearUsuarioConCredencial(client, {
      rol: ROLES.GERENTE,
      nombre,
      sucursalId: sucursalDestino,
      creadoPorId: actor.id,
    });
  });

  return respuestaConCredencial(creado);
}

async function crearEmpleado(actor, { nombre, tipo, sucursalId }) {
  const rol = TIPO_EMPLEADO_A_ROL[tipo];

  if (!rol) {
    throw new BadRequestError(
      "El tipo de empleado debe ser 'ventas' o 'laboratorio'."
    );
  }

  validarRolPermitido(actor.rol, rol);

  const sucursalDestino = resolverSucursalEmpleado(actor, sucursalId);

  const creado = await tx.ejecutar(async (client) => {
    await exigirSucursalActiva(client, sucursalDestino);

    return crearUsuarioConCredencial(client, {
      rol,
      nombre,
      sucursalId: sucursalDestino,
      creadoPorId: actor.id,
    });
  });

  return respuestaConCredencial(creado);
}

/* =========================================================
   CONSULTAS
========================================================= */

async function obtenerOpcionesFormulario(actor, usuarioEditarId = null) {
  const aOpcion = (s) => ({ value: s.id, label: s.nombre });

  let sucursales = [];

  if (actor.rol === ROLES.GERENTE) {
    // El gerente solo ve su propia sucursal
    if (actor.sucursal_id) {
      const propia = await sucursalesRepo.buscarActivaPorId(actor.sucursal_id);
      sucursales = propia ? [propia] : [];
    }
  } else {
    // Dueño y super usuario ven todas las sucursales activas
    sucursales = await sucursalesRepo.listarActivas();
  }

  // Sucursales sin gerente (incluye la actual si se edita un gerente)
  let sucursalesGerente = [];

  if (actor.rol === ROLES.SUPER_USUARIO || actor.rol === ROLES.DUENO) {
    sucursalesGerente = await sucursalesRepo.listarSinGerente(usuarioEditarId);
  }

  return {
    roles: opcionesDeRoles(actor.rol),
    sucursales: sucursales.map(aOpcion),
    sucursalesGerente: sucursalesGerente.map(aOpcion),
  };
}

async function obtenerUsuarios(actor) {
  const filas = await usuariosRepo.listar({
    rol: actor.rol,
    sucursalId: actor.sucursal_id,
    usuarioId: actor.id,
  });

  return filas.map(aUsuarioFront);
}

/* =========================================================
   ACTUALIZAR
========================================================= */

async function actualizarUsuario(
  actor,
  usuarioId,
  { rolNuevo, sucursalId, nuevaSucursalNombre }
) {
  await tx.ejecutar(async (client) => {
    const usuario = await usuariosRepo.buscarPorId(usuarioId, client, {
      bloquear: true,
    });

    if (!usuario) {
      throw new AppError("El usuario no existe.", 404);
    }

    if (!usuario.activo) {
      throw new BadRequestError("No puedes editar un usuario inactivo.");
    }

    validarRolPermitido(actor.rol, rolNuevo);
    validarPuedeGestionar(actor, usuario, "editar");

    let sucursalDestino = null;

    if (rolNuevo === ROLES.GERENTE) {
      sucursalDestino = await resolverSucursalGerente(client, {
        sucursalId,
        nuevaSucursalNombre,
        gerenteId: usuario.id,
      });
    } else if (rolNuevo === ROLES.VENTAS || rolNuevo === ROLES.LABORATORIO) {
      sucursalDestino = resolverSucursalEmpleado(actor, sucursalId);
      await exigirSucursalActiva(client, sucursalDestino);
    }
    // super_usuario y dueño no necesitan sucursal (null)

    // Solo se actualizan rol y sucursal
    await usuariosRepo.actualizarRolYSucursal(
      usuarioId,
      rolNuevo,
      sucursalDestino,
      client
    );
  });

  return aUsuarioFront(await usuariosRepo.buscarParaFront(usuarioId));
}

/* =========================================================
   DAR DE BAJA / ALTA
========================================================= */

async function cambiarEstado(actor, usuarioId, activar) {
  const accion = activar ? "dar de alta" : "dar de baja";

  await tx.ejecutar(async (client) => {
    const usuario = await usuariosRepo.buscarPorId(usuarioId, client, {
      bloquear: true,
    });

    if (!usuario) {
      throw new AppError("El usuario no existe.", 404);
    }

    if (usuario.activo === activar) {
      throw new BadRequestError(
        activar ? "El usuario ya está activo." : "El usuario ya está inactivo."
      );
    }

    validarPuedeGestionar(actor, usuario, accion);

    // Nunca se permite dar de baja al propio usuario
    if (!activar && usuarioId === actor.id) {
      throw new ForbiddenError("No puedes dar de baja tu propio usuario.");
    }

    await usuariosRepo.cambiarEstado(usuarioId, activar, client);
  });

  return aUsuarioFront(await usuariosRepo.buscarParaFront(usuarioId));
}

const darDeBajaUsuario = (actor, id) => cambiarEstado(actor, id, false);
const darDeAltaUsuario = (actor, id) => cambiarEstado(actor, id, true);

module.exports = {
  crearUsuarioConCredencial,
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