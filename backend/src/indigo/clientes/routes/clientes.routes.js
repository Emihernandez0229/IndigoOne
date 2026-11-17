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

// El dueño solo consulta; ventas no tiene acceso
const CONSULTA = ["dueno", "gerente_sucursal", "subgerente_sucursal"];

// Crean y administran clientes de su sucursal
const ENCARGADOS = ["gerente_sucursal", "subgerente_sucursal"];

router.use(autenticar, soloTipo("indigo"));

router.get("/", soloRol(...CONSULTA), controller.listarClientes);

router.get("/buscar", soloRol(...ENCARGADOS), controller.buscarPorCodigo);

router.post(
  "/",
  soloRol(...ENCARGADOS),
  validate(schemas.crear),
  controller.crearCliente
);

router.post(
  "/asignar-proveedor",
  soloRol(...ENCARGADOS),
  validate(schemas.asignarProveedor),
  controller.asignarProveedor
);

router.put(
  "/:id",
  soloRol(...ENCARGADOS),
  validate(schemas.actualizar),
  controller.actualizarCliente
);

router.patch("/:id/deactivate", soloRol(...ENCARGADOS), controller.darDeBajaCliente);
router.patch("/:id/activate", soloRol(...ENCARGADOS), controller.darDeAltaCliente);

module.exports = router;