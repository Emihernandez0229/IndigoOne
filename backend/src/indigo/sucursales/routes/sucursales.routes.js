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
const ENCARGADOS = ["gerente_sucursal", "subgerente_sucursal"];
const CONSULTA = [...ADMINS, ...ENCARGADOS];

router.use(autenticar, soloTipo("indigo"));

// Consultar sucursales (gerente y subgerente solo ven la suya)
router.get("/", soloRol(...CONSULTA), controller.listarSucursales);

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
  validate(schemas.crear),
  controller.crearSucursal
);

// Editar nombre, ubicación y responsable (dueño)
router.put(
  "/:id",
  soloRol(...ADMINS),
  validate(schemas.actualizar),
  controller.actualizarSucursal
);

// Editar dirección y teléfono de la sucursal (gerente y subgerente)
router.patch(
  "/:id/contacto",
  soloRol(...ENCARGADOS),
  validate(schemas.contacto),
  controller.actualizarContacto
);

// Dar de baja / alta
router.patch("/:id/deactivate", soloRol(...ADMINS), controller.darDeBaja);
router.patch("/:id/activate", soloRol(...ADMINS), controller.darDeAlta);

// Cambiar gerente
router.post(
  "/:id/asignar-gerente",
  soloRol(...ADMINS),
  validate(schemas.asignarGerente),
  controller.asignarGerente
);

module.exports = router;