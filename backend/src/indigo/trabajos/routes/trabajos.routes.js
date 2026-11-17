const express = require("express");

const controller = require("../controllers/trabajos.controller");
const schemas = require("../schemas/trabajos.schemas");
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
  "empleado_laboratorio",
];

const VENTAS = ["empleado_ventas"];
const LABORATORIO = ["empleado_laboratorio"];

router.use(autenticar, soloTipo("indigo"));

router.get("/", soloRol(...CONSULTA), controller.listarTrabajos);

// Lo que ventas necesita para armar el formulario (clientes y vendedores)
router.get("/opciones", soloRol(...VENTAS), controller.obtenerOpciones);

router.post(
  "/",
  soloRol(...VENTAS),
  validate(schemas.crear),
  controller.crearTrabajo
);

router.patch("/:id/aceptar", soloRol(...LABORATORIO), controller.aceptarTrabajo);
router.patch("/:id/terminar", soloRol(...LABORATORIO), controller.terminarTrabajo);

router.patch(
  "/:id/merma",
  soloRol(...LABORATORIO),
  validate(schemas.merma),
  controller.registrarMerma
);

router.post(
  "/:id/detalles",
  soloRol(...LABORATORIO),
  validate(schemas.detalle),
  controller.agregarDetalle
);

module.exports = router;