const express = require("express");

const controller = require("../controllers/inventario.controller");
const schemas = require("../schemas/inventario.schemas");
const validate = require("../../../core/middlewares/validation.middleware");
const {
  autenticar,
  soloTipo,
  soloRol,
} = require("../../../core/middlewares/auth.middleware");

const router = express.Router();

// El dueño ve todas las sucursales; los demás, la suya
const CONSULTA = [
  "dueno",
  "gerente_sucursal",
  "subgerente_sucursal",
  "empleado_ventas",
];

// Administran el inventario de su sucursal (el super usuario también pasa)
const GESTORES = ["gerente_sucursal", "subgerente_sucursal"];

router.use(autenticar, soloTipo("indigo"));

router.get("/", soloRol(...CONSULTA), controller.listarInventario);

router.post(
  "/",
  soloRol(...GESTORES),
  validate(schemas.crear),
  controller.crearProducto
);

router.put(
  "/:id",
  soloRol(...GESTORES),
  validate(schemas.actualizar),
  controller.actualizarProducto
);

router.patch("/:id/deactivate", soloRol(...GESTORES), controller.darDeBajaProducto);
router.patch("/:id/activate", soloRol(...GESTORES), controller.darDeAltaProducto);

module.exports = router;