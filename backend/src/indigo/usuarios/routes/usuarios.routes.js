// const express = require("express");
// const router = express.Router();
// const usuariosController = require("../controllers/usuarios.controller");
// const {autenticar, soloTipo, soloRol,} = require("../../../core/middlewares/auth.middleware");


// // Bootstrap del primer super usuario
// router.post("/bootstrap-super-usuario",usuariosController.crearPrimerSuperUsuario);
// // Todas las rutas siguientes requieren autenticación
// router.use(autenticar,soloTipo("indigo"));
// // Crear usuarios
// router.post("/",soloRol("super_usuario","dueno","gerente_sucursal"),usuariosController.crearUsuario);
// // Sucursales disponibles
// router.get("/sucursales-disponibles",soloRol("super_usuario","dueno","gerente_sucursal"),usuariosController.listarSucursalesDisponibles);
// // Obtener usuarios
// router.get("/",soloRol("super_usuario","dueno","gerente_sucursal"),usuariosController.obtenerUsuarios);
// // Editar usuario
// router.put("/:id",soloRol("super_usuario","dueno","gerente_sucursal"),usuariosController.actualizarUsuario);
// // Dar de baja
// router.patch("/:id/deactivate",soloRol("super_usuario","dueno","gerente_sucursal"),usuariosController.darDeBajaUsuario);


// module.exports = router;


const express = require("express");

const router =
  express.Router();


const usuariosController =
  require("../controllers/usuarios.controller");


const {
  autenticar,
  soloTipo,
  soloRol,
} =
  require("../../../core/middlewares/auth.middleware");


/*
 * Bootstrap:
 * únicamente se utiliza para crear
 * el primer super usuario.
 */

router.post(
  "/bootstrap-super-usuario",
  usuariosController.crearPrimerSuperUsuario
);


/*
 * Desde aquí todo requiere autenticación
 * y pertenecer a Indigo.
 */

router.use(
  autenticar,
  soloTipo("indigo")
);


/* =========================================================
   OPCIONES DEL FORMULARIO
========================================================= */

router.get(
  "/opciones-formulario",
  soloRol(
    "super_usuario",
    "dueno",
    "gerente_sucursal"
  ),
  usuariosController.obtenerOpcionesFormulario
);


/* =========================================================
   CREACIÓN
========================================================= */


/*
 * Super usuario:
 * puede crear super usuarios.
 */

router.post(
  "/super-usuarios",
  soloRol("super_usuario"),
  usuariosController.crearSuperUsuario
);


/*
 * Super usuario:
 * puede crear dueños.
 */

router.post(
  "/duenos",
  soloRol("super_usuario"),
  usuariosController.crearDueno
);


/*
 * Super usuario y dueño:
 * pueden crear gerentes.
 */

router.post(
  "/gerentes",
  soloRol(
    "super_usuario",
    "dueno"
  ),
  usuariosController.crearGerenteSucursal
);


/*
 * Super usuario, dueño y gerente:
 * pueden crear empleados.
 */

router.post(
  "/empleados",
  soloRol(
    "super_usuario",
    "dueno",
    "gerente_sucursal"
  ),
  usuariosController.crearEmpleado
);


/* =========================================================
   LISTADO
========================================================= */

router.get(
  "/",
  soloRol(
    "super_usuario",
    "dueno",
    "gerente_sucursal"
  ),
  usuariosController.obtenerUsuarios
);


/* =========================================================
   EDICIÓN
========================================================= */

router.put(
  "/:id",
  soloRol(
    "super_usuario",
    "dueno",
    "gerente_sucursal"
  ),
  usuariosController.actualizarUsuario
);


/* =========================================================
   BAJA
========================================================= */

router.patch(
  "/:id/deactivate",
  soloRol(
    "super_usuario",
    "dueno",
    "gerente_sucursal"
  ),
  usuariosController.darDeBajaUsuario
);


/* =========================================================
   ALTA
========================================================= */

router.patch(
  "/:id/activate",
  soloRol(
    "super_usuario",
    "dueno",
    "gerente_sucursal"
  ),
  usuariosController.darDeAltaUsuario
);


module.exports = router;

