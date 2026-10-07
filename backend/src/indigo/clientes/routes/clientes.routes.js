const express = require("express");

const controller = require("../controllers/clientes.controller");
const schemas = require("../schemas/clientes.schemas");
const validate = require("../../../core/middlewares/validation.middleware");
const {
  autenticar,
  soloTipo,
  soloRol,
} = require("../../../core/middlewares/auth.middleware");

const router = express.Router();

router.use(autenticar, soloTipo("indigo"), soloRol("dueno", "gerente_sucursal"));

router.post("/", validate(schemas.crearOptica), controller.crearOptica);

router.get("/buscar", controller.buscarPorCodigo);

router.post(
  "/asignar-proveedor",
  validate(schemas.asignarProveedor),
  controller.asignarProveedor
);

module.exports = router;