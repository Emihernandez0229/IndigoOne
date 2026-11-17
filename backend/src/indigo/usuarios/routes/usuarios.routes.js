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

// Crean y editan personal
const GESTORES = ["super_usuario", "gerente_sucursal", "subgerente_sucursal"];

// Consultan y dan de baja/alta (el dueño solo a gerentes)
const CONSULTA = ["super_usuario", "dueno", "gerente_sucursal", "subgerente_sucursal"];

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

/* Mi perfil: cualquier usuario de Indigo (va antes de "/:id") */
router.put("/mi-perfil", validate(schemas.miPerfil), controller.actualizarMiPerfil);

router.patch(
  "/mi-perfil/password",
  validate(schemas.cambiarPassword),
  controller.cambiarMiPassword
);

/* Opciones del formulario */
router.get(
  "/opciones-formulario",
  soloRol(...GESTORES),
  controller.obtenerOpcionesFormulario
);

/* Alta (cualquier rol permitido) */
router.post("/", soloRol(...GESTORES), validate(schemas.crear), controller.crearUsuario);

/* Listado */
router.get("/", soloRol(...CONSULTA), controller.obtenerUsuarios);

/* Edición */
router.put(
  "/:id",
  soloRol(...GESTORES),
  validate(schemas.actualizar),
  controller.actualizarUsuario
);

/* Baja / Alta */
router.patch("/:id/deactivate", soloRol(...CONSULTA), controller.darDeBajaUsuario);
router.patch("/:id/activate", soloRol(...CONSULTA), controller.darDeAltaUsuario);

/* Restablecer contraseña (solo Super usuario) */
router.patch(
  "/:id/resetear-password",
  soloRol("super_usuario"),
  controller.resetearPassword
);

module.exports = router;