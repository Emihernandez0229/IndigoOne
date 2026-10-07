const express = require("express");

const controller = require("../controllers/sucursales.controller");
const schemas = require("../schemas/sucursales.schemas");
const validate = require("../../../core/middlewares/validation.middleware");
const {
  autenticar,
  soloTipo,
  soloRol,
} = require("../../../core/middlewares/auth.middleware");

const router = express.Router();

const ADMINS = ["dueno", "super_usuario"];
const GESTORES = ["dueno", "super_usuario", "gerente_sucursal"];

router.use(autenticar, soloTipo("indigo"));

// Consultar sucursales
router.get("/", soloRol(...GESTORES), controller.listarSucursales);

// Gerentes disponibles
router.get(
  "/gerentes-disponibles",
  soloRol(...ADMINS),
  controller.listarGerentesDisponibles
);

// Crear sucursal
router.post(
  "/",
  soloRol(...ADMINS),
  validate(schemas.sucursal),
  controller.crearSucursal
);

// Editar sucursal
router.put(
  "/:id",
  soloRol(...GESTORES),
  validate(schemas.sucursal),
  controller.actualizarSucursal
);

// Dar de baja
router.patch("/:id/deactivate", soloRol(...ADMINS), controller.darDeBaja);

// Dar de alta
router.patch("/:id/activate", soloRol(...ADMINS), controller.darDeAlta);

// Cambiar gerente
router.post(
  "/:id/asignar-gerente",
  soloRol(...ADMINS),
  validate(schemas.asignarGerente),
  controller.asignarGerente
);

module.exports = router;