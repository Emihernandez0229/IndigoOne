const pool = require("../../../config/db");
const TransactionManager = require("../../../core/database/transaction-manager");
const {
  AppError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} = require("../../../core/utils/errors");

const inventarioRepo = require("../repositories/inventario.repository");
const sucursalesRepo = require("../../sucursales/repositories/sucursales.repository");
const { aProductoFront } = require("../helpers/inventario.mapper");
const { ROLES, esEncargado } = require("../../usuarios/helpers/usuarios.permisos");

const tx = new TransactionManager(pool);

const MSG_CODIGO = "Ya existe un producto con ese código en esta sucursal.";

// Roles que solo ven el inventario de su sucursal
const ROLES_DE_SUCURSAL = [ROLES.GERENTE, ROLES.SUBGERENTE, ROLES.VENTAS];

const productoNoEncontrado = () => new AppError("El producto no existe.", 404);

async function respuestaProducto(id) {
  return aProductoFront(await inventarioRepo.buscarParaFront(id));
}

// Gerente y subgerente trabajan en su sucursal; el super usuario elige una
function resolverSucursal(actor, sucursalId) {
  if (esEncargado(actor.rol)) {
    if (!actor.sucursal_id) {
      throw new BadRequestError("No tienes una sucursal asignada.");
    }
    return actor.sucursal_id;
  }

  if (!sucursalId) {
    throw new BadRequestError("Debes seleccionar una sucursal.");
  }
  return sucursalId;
}

function exigirAcceso(actor, producto) {
  if (esEncargado(actor.rol) && producto.indigo_sucursal_id !== actor.sucursal_id) {
    throw new ForbiddenError("Solo puedes administrar el inventario de tu sucursal.");
  }
}

/* =========================================================
   LISTADO
========================================================= */

async function listarInventario(actor) {
  let indigoSucursalId = null;

  if (ROLES_DE_SUCURSAL.includes(actor.rol)) {
    // Sin sucursal asignada no se ve nada (nunca "todo")
    if (!actor.sucursal_id) return [];
    indigoSucursalId = actor.sucursal_id;
  }

  const filas = await inventarioRepo.listar({ indigoSucursalId });

  return filas.map(aProductoFront);
}

/* =========================================================
   ALTA
========================================================= */

async function crearProducto(actor, { sucursalId: sucursalElegida, ...datos }) {
  const sucursalId = resolverSucursal(actor, sucursalElegida);
  let id;

  try {
    id = await tx.ejecutar(async (client) => {
      const sucursal = await sucursalesRepo.buscarActivaPorId(sucursalId, client);

      if (!sucursal) {
        throw new AppError("La sucursal indicada no existe.", 404);
      }

      if (await inventarioRepo.existeCodigo(sucursalId, datos.codigo, null, client)) {
        throw new ConflictError(MSG_CODIGO);
      }

      const producto = await inventarioRepo.insertar(
        { ...datos, sucursalId, creadoPorId: actor.id },
        client
      );

      return producto.id;
    });
  } catch (err) {
    // Dos altas simultáneas con el mismo código
    if (err.code === "23505") throw new ConflictError(MSG_CODIGO);
    throw err;
  }

  return respuestaProducto(id);
}

/* =========================================================
   ACTUALIZAR
========================================================= */

async function actualizarProducto(actor, id, datos) {
  try {
    await tx.ejecutar(async (client) => {
      const producto = await inventarioRepo.buscarPorId(id, client, {
        bloquear: true,
      });

      if (!producto) throw productoNoEncontrado();

      exigirAcceso(actor, producto);

      if (
        await inventarioRepo.existeCodigo(
          producto.indigo_sucursal_id,
          datos.codigo,
          id,
          client
        )
      ) {
        throw new ConflictError(MSG_CODIGO);
      }

      await inventarioRepo.actualizar(id, datos, client);
    });
  } catch (err) {
    if (err.code === "23505") throw new ConflictError(MSG_CODIGO);
    throw err;
  }

  return respuestaProducto(id);
}

/* =========================================================
   DAR DE BAJA / ALTA
========================================================= */

async function cambiarEstado(actor, id, activar) {
  await tx.ejecutar(async (client) => {
    const producto = await inventarioRepo.buscarPorId(id, client, {
      bloquear: true,
    });

    if (!producto) throw productoNoEncontrado();

    exigirAcceso(actor, producto);

    if (producto.activo === activar) {
      throw new BadRequestError(
        activar ? "El producto ya está activo." : "El producto ya está inactivo."
      );
    }

    await inventarioRepo.cambiarEstado(id, activar, client);
  });

  return respuestaProducto(id);
}

const darDeBajaProducto = (actor, id) => cambiarEstado(actor, id, false);
const darDeAltaProducto = (actor, id) => cambiarEstado(actor, id, true);

module.exports = {
  listarInventario,
  crearProducto,
  actualizarProducto,
  darDeBajaProducto,
  darDeAltaProducto,
};