// const express = require("express");

// const router =
//   express.Router();


// const usuariosController =
//   require("../controllers/usuarios.controller");


// const {
//   autenticar,
//   soloTipo,
//   soloRol,
// } =
//   require("../../../core/middlewares/auth.middleware");


// /*
//  * Bootstrap:
//  * únicamente se utiliza para crear
//  * el primer super usuario.
//  */

// router.post(
//   "/bootstrap-super-usuario",
//   usuariosController.crearPrimerSuperUsuario
// );


// /*
//  * Desde aquí todo requiere autenticación
//  * y pertenecer a Indigo.
//  */

// router.use(
//   autenticar,
//   soloTipo("indigo")
// );


// /* =========================================================
//    OPCIONES DEL FORMULARIO
// ========================================================= */

// router.get(
//   "/opciones-formulario",
//   soloRol(
//     "super_usuario",
//     "dueno",
//     "gerente_sucursal"
//   ),
//   usuariosController.obtenerOpcionesFormulario
// );


// /* =========================================================
//    CREACIÓN
// ========================================================= */


// /*
//  * Super usuario:
//  * puede crear super usuarios.
//  */

// router.post(
//   "/super-usuarios",
//   soloRol("super_usuario"),
//   usuariosController.crearSuperUsuario
// );


// /*
//  * Super usuario:
//  * puede crear dueños.
//  */

// router.post(
//   "/duenos",
//   soloRol("super_usuario"),
//   usuariosController.crearDueno
// );


// /*
//  * Super usuario y dueño:
//  * pueden crear gerentes.
//  */

// router.post(
//   "/gerentes",
//   soloRol(
//     "super_usuario",
//     "dueno"
//   ),
//   usuariosController.crearGerenteSucursal
// );


// /*
//  * Super usuario, dueño y gerente:
//  * pueden crear empleados.
//  */

// router.post(
//   "/empleados",
//   soloRol(
//     "super_usuario",
//     "dueno",
//     "gerente_sucursal"
//   ),
//   usuariosController.crearEmpleado
// );


// /* =========================================================
//    LISTADO
// ========================================================= */

// router.get(
//   "/",
//   soloRol(
//     "super_usuario",
//     "dueno",
//     "gerente_sucursal"
//   ),
//   usuariosController.obtenerUsuarios
// );


// /* =========================================================
//    EDICIÓN
// ========================================================= */

// router.put(
//   "/:id",
//   soloRol(
//     "super_usuario",
//     "dueno",
//     "gerente_sucursal"
//   ),
//   usuariosController.actualizarUsuario
// );


// /* =========================================================
//    BAJA
// ========================================================= */

// router.patch(
//   "/:id/deactivate",
//   soloRol(
//     "super_usuario",
//     "dueno",
//     "gerente_sucursal"
//   ),
//   usuariosController.darDeBajaUsuario
// );


// /* =========================================================
//    ALTA
// ========================================================= */

// router.patch(
//   "/:id/activate",
//   soloRol(
//     "super_usuario",
//     "dueno",
//     "gerente_sucursal"
//   ),
//   usuariosController.darDeAltaUsuario
// );


// module.exports = router;

const express = require("express");

const controller = require("../controllers/usuarios.controller");
const schemas = require("../schemas/usuarios.schemas");
const validate = require("../../../core/middlewares/validation.middleware");
const {
  autenticar,
  soloTipo,
  soloRol,
} = require("../../../core/middlewares/auth.middleware");

const router = express.Router();

const GESTORES = ["super_usuario", "dueno", "gerente_sucursal"];

/*
 * Bootstrap: únicamente para crear el primer super usuario.
 */
router.post(
  "/bootstrap-super-usuario",
  validate(schemas.primerSuperUsuario),
  controller.crearPrimerSuperUsuario
);

/*
 * Desde aquí todo requiere autenticación y pertenecer a Indigo.
 */
router.use(autenticar, soloTipo("indigo"));

/* Opciones del formulario */
router.get(
  "/opciones-formulario",
  soloRol(...GESTORES),
  controller.obtenerOpcionesFormulario
);

/* Creación */
router.post(
  "/super-usuarios",
  soloRol("super_usuario"),
  validate(schemas.soloNombre),
  controller.crearSuperUsuario
);

router.post(
  "/duenos",
  soloRol("super_usuario"),
  validate(schemas.soloNombre),
  controller.crearDueno
);

router.post(
  "/gerentes",
  soloRol("super_usuario", "dueno"),
  validate(schemas.gerente),
  controller.crearGerenteSucursal
);

router.post(
  "/empleados",
  soloRol(...GESTORES),
  validate(schemas.empleado),
  controller.crearEmpleado
);

/* Listado */
router.get("/", soloRol(...GESTORES), controller.obtenerUsuarios);

/* Edición */
router.put(
  "/:id",
  soloRol(...GESTORES),
  validate(schemas.actualizar),
  controller.actualizarUsuario
);

/* Baja / Alta */
router.patch("/:id/deactivate", soloRol(...GESTORES), controller.darDeBajaUsuario);
router.patch("/:id/activate", soloRol(...GESTORES), controller.darDeAltaUsuario);

module.exports = router;