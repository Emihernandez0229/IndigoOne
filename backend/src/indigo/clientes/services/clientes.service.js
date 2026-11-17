const bcrypt = require("bcrypt");

const pool = require("../../../config/db");
const TransactionManager = require("../../../core/database/transaction-manager");
const {
  existeUsuarioGlobal,
  registrarCredencialGlobal,
} = require("../../../core/services/credenciales.service");
const {
  AppError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} = require("../../../core/utils/errors");

const clientesRepo = require("../repositories/clientes.repository");
const sucursalesRepo = require("../../sucursales/repositories/sucursales.repository");
const { aClienteFront } = require("../helpers/clientes.mapper");
const { ROLES, esEncargado } = require("../../usuarios/helpers/usuarios.permisos");

const SALT_ROUNDS = 10;
const tx = new TransactionManager(pool);

// Roles que solo ven los clientes que atiende su sucursal
const ROLES_DE_SUCURSAL = [ROLES.GERENTE, ROLES.SUBGERENTE];

// Quita el hash de la contraseña antes de responder
function sinPassword({ password_hash, ...resto }) {
  return resto;
}

const clienteNoEncontrado = () => new AppError("El cliente no existe.", 404);

// Gerente y subgerente ven solo lo que atiende su sucursal de Indigo
async function respuestaCliente(actor, opticaId) {
  const alcance = esEncargado(actor.rol) ? actor.sucursal_id : null;

  return aClienteFront(await clientesRepo.buscarParaFront(opticaId, alcance));
}

// Gerente y subgerente solo operan en su sucursal; el super usuario elige
function resolverSucursalIndigo(actor, indigoSucursalId) {
  if (esEncargado(actor.rol)) {
    if (!actor.sucursal_id) {
      throw new BadRequestError("No tienes una sucursal asignada.");
    }
    return actor.sucursal_id;
  }

  if (!indigoSucursalId) {
    throw new BadRequestError("Debes indicar la sucursal de Indigo.");
  }
  return indigoSucursalId;
}

// Un gerente/subgerente solo administra clientes que atiende su sucursal
async function exigirAccesoAlCliente(actor, opticaId, client) {
  if (!esEncargado(actor.rol)) return;

  const tieneAcceso =
    actor.sucursal_id &&
    (await clientesRepo.perteneceASucursal(opticaId, actor.sucursal_id, client));

  if (!tieneAcceso) {
    throw new ForbiddenError("Solo puedes administrar clientes de tu sucursal.");
  }
}

/* =========================================================
   LISTADO
========================================================= */

async function listarClientes(actor) {
  let indigoSucursalId = null;

  if (ROLES_DE_SUCURSAL.includes(actor.rol)) {
    // Sin sucursal asignada no se ve nada (nunca "todos")
    if (!actor.sucursal_id) return [];
    indigoSucursalId = actor.sucursal_id;
  }

  const filas = await clientesRepo.listarParaFront({ indigoSucursalId });

  return filas.map(aClienteFront);
}

/* =========================================================
   ALTA (óptica + dueño + primera sucursal + proveedor)
========================================================= */

async function crearCliente(actor, datos) {
  const indigoSucursalId = resolverSucursalIndigo(actor, datos.indigoSucursalId);
  const codigo = datos.codigo.toUpperCase();

  if (await existeUsuarioGlobal(codigo)) {
    throw new ConflictError("Ese código ya está en uso en el sistema, usa otro");
  }

  // El código es el usuario y la contraseña inicial del dueño de la óptica
  const passwordHash = await bcrypt.hash(codigo, SALT_ROUNDS);

  const opticaId = await tx.ejecutar(async (client) => {
    const sucursalIndigo = await sucursalesRepo.buscarActivaPorId(
      indigoSucursalId,
      client
    );

    if (!sucursalIndigo) {
      throw new AppError("Esa sucursal de Indigo no existe", 404);
    }

    // País y estado del cliente = los de la sucursal de Indigo que lo da de alta
    if (!sucursalIndigo.pais || !sucursalIndigo.estado) {
      throw new BadRequestError(
        "La sucursal de Indigo no tiene país y estado registrados. Pide al dueño que los complete."
      );
    }

    const optica = await clientesRepo.insertarOptica(
      {
        codigo,
        razonSocial: datos.razonSocial,
        rfc: datos.rfc.toUpperCase(),
        pais: sucursalIndigo.pais,
        estado: sucursalIndigo.estado,
        municipio: datos.municipio,
        direccion: datos.direccion,
        codigoPostal: datos.codigoPostal,
        passwordHash,
        creadoPorId: actor.id,
      },
      client
    );

    const dueno = await clientesRepo.insertarDueno(
      {
        opticaId: optica.id,
        nombre: datos.razonSocial,
        usuario: codigo,
        passwordHash,
      },
      client
    );

    await registrarCredencialGlobal(client, {
      usuario: codigo,
      tipo: "optica",
      referenciaId: dueno.id,
    });

    // Primera sucursal del cliente, atendida por la sucursal de Indigo
    const sucursalCliente = await clientesRepo.insertarSucursalCliente(
      { opticaId: optica.id, nombre: datos.sucursalClienteNombre },
      client
    );

    await clientesRepo.asignarProveedor(
      {
        sucursalId: sucursalCliente.id,
        indigoSucursalId,
        asignadoPorId: actor.id,
      },
      client
    );

    return optica.id;
  });

  return respuestaCliente(actor, opticaId);
}

/* =========================================================
   ACTUALIZAR
========================================================= */

async function actualizarCliente(actor, opticaId, datos) {
  await tx.ejecutar(async (client) => {
    const optica = await clientesRepo.buscarPorId(opticaId, client, {
      bloquear: true,
    });

    if (!optica) throw clienteNoEncontrado();

    await exigirAccesoAlCliente(actor, opticaId, client);

    await clientesRepo.actualizarDatos(
      opticaId,
      { ...datos, rfc: datos.rfc.toUpperCase() },
      client
    );
  });

  return respuestaCliente(actor, opticaId);
}

/* =========================================================
   DAR DE BAJA / ALTA
   Gerente y subgerente solo afectan las sucursales del cliente que atiende
   su sucursal de Indigo; el cliente queda inactivo cuando ya no tiene
   ninguna sucursal activa.
========================================================= */

async function cambiarEstado(actor, opticaId, activar) {
  await tx.ejecutar(async (client) => {
    const optica = await clientesRepo.buscarPorId(opticaId, client, {
      bloquear: true,
    });

    if (!optica) throw clienteNoEncontrado();

    await exigirAccesoAlCliente(actor, opticaId, client);

    const alcance = esEncargado(actor.rol) ? actor.sucursal_id : null;

    const activoActual = await clientesRepo.estaActivoEnAlcance(
      opticaId,
      alcance,
      client
    );

    if (activoActual === activar) {
      throw new BadRequestError(
        activar ? "El cliente ya está activo." : "El cliente ya está inactivo."
      );
    }

    await clientesRepo.cambiarEstadoSucursales(opticaId, activar, alcance, client);
    await clientesRepo.sincronizarEstadoOptica(opticaId, client);
  });

  return respuestaCliente(actor, opticaId);
}

const darDeBajaCliente = (actor, id) => cambiarEstado(actor, id, false);
const darDeAltaCliente = (actor, id) => cambiarEstado(actor, id, true);

/* =========================================================
   BUSCAR POR CÓDIGO
========================================================= */

async function buscarPorCodigo(codigo) {
  const optica = await clientesRepo.buscarOpticaActivaPorCodigo(
    codigo.toUpperCase()
  );

  if (!optica) {
    throw new AppError("No existe ningún cliente con ese código", 404);
  }

  const sucursales = await clientesRepo.listarSucursalesConProveedor(optica.id);

  return { optica: sinPassword(optica), sucursales };
}

/* =========================================================
   ASIGNAR PROVEEDOR
========================================================= */

async function asignarProveedor(actor, { sucursalId, indigoSucursalId }) {
  const sucursalCliente = await clientesRepo.buscarSucursalActivaPorId(sucursalId);

  if (!sucursalCliente) {
    throw new AppError("Esa sucursal del cliente no existe", 404);
  }

  // Gerente y subgerente solo asignan clientes a su propia sucursal de Indigo
  if (esEncargado(actor.rol) && indigoSucursalId !== actor.sucursal_id) {
    throw new ForbiddenError(
      "Solo puedes asignar clientes a tu propia sucursal de Indigo"
    );
  }

  const sucursalIndigo = await sucursalesRepo.buscarActivaPorId(indigoSucursalId);

  if (!sucursalIndigo) {
    throw new AppError("Esa sucursal de Indigo no existe", 404);
  }

  return clientesRepo.asignarProveedor({
    sucursalId,
    indigoSucursalId,
    asignadoPorId: actor.id,
  });
}

module.exports = {
  listarClientes,
  crearCliente,
  actualizarCliente,
  darDeBajaCliente,
  darDeAltaCliente,
  buscarPorCodigo,
  asignarProveedor,
};