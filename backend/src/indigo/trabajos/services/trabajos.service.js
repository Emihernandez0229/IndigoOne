const pool = require("../../../config/db");
const TransactionManager = require("../../../core/database/transaction-manager");
const {
  AppError,
  BadRequestError,
  ForbiddenError,
} = require("../../../core/utils/errors");

const trabajosRepo = require("../repositories/trabajos.repository");
const clientesRepo = require("../../clientes/repositories/clientes.repository");
const usuariosRepo = require("../../usuarios/repositories/usuarios.repository");
const { aTrabajoFront } = require("../helpers/trabajos.mapper");
const { ROLES } = require("../../usuarios/helpers/usuarios.permisos");

const tx = new TransactionManager(pool);

// Roles que ven todos los trabajos de su sucursal
const ROLES_DE_SUCURSAL = [ROLES.GERENTE, ROLES.SUBGERENTE, ROLES.LABORATORIO];

async function respuestaTrabajo(id) {
  return aTrabajoFront(await trabajosRepo.buscarParaFront(id));
}

// Carga el trabajo (bloqueado) y exige que sea de la sucursal de quien opera
async function cargarTrabajoDeMiSucursal(actor, id, client) {
  const trabajo = await trabajosRepo.buscarPorId(id, client, { bloquear: true });

  if (!trabajo) {
    throw new AppError("El trabajo no existe.", 404);
  }

  if (!actor.sucursal_id || trabajo.indigo_sucursal_id !== actor.sucursal_id) {
    throw new ForbiddenError("Solo puedes operar trabajos de tu sucursal.");
  }

  return trabajo;
}

/* =========================================================
   CONSULTAS
========================================================= */

async function listarTrabajos(actor) {
  let filtro = {};

  if (actor.rol === ROLES.VENTAS) {
    // Ventas solo ve los trabajos que registró
    if (!actor.sucursal_id) return [];
    filtro = { indigoSucursalId: actor.sucursal_id, creadoPor: actor.id };
  } else if (ROLES_DE_SUCURSAL.includes(actor.rol)) {
    // Sin sucursal asignada no se ve nada (nunca "todos")
    if (!actor.sucursal_id) return [];
    filtro = { indigoSucursalId: actor.sucursal_id };
  }

  const filas = await trabajosRepo.listar(filtro);

  return filas.map(aTrabajoFront);
}

// Clientes de la sucursal y vendedores (yo, primero) para el formulario
async function obtenerOpciones(actor) {
  if (!actor.sucursal_id) {
    throw new BadRequestError("No tienes una sucursal asignada.");
  }

  const [clientes, usuarios] = await Promise.all([
    clientesRepo.listarParaFront({ indigoSucursalId: actor.sucursal_id }),
    usuariosRepo.listar({ roles: [ROLES.VENTAS], sucursalId: actor.sucursal_id }),
  ]);

  const clientesOpciones = clientes
    .filter((c) => c.activo)
    .map((c) => ({ value: c.id, label: c.razon_social }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const vendedores = usuarios
    .filter((u) => u.activo)
    .map((u) => ({
      value: u.id,
      label: u.id === actor.id ? `${u.nombre} (yo)` : u.nombre,
    }))
    .sort((a, b) => {
      if (a.value === actor.id) return -1;
      if (b.value === actor.id) return 1;
      return a.label.localeCompare(b.label);
    });

  return { clientes: clientesOpciones, vendedores };
}

/* =========================================================
   REGISTRAR (ventas)
========================================================= */

async function crearTrabajo(
  actor,
  { clienteId, vendedorId, tipoServicio, tipoBisel, cantidad, urgente, fechaEntrega }
) {
  if (!actor.sucursal_id) {
    throw new BadRequestError("No tienes una sucursal asignada.");
  }

  // Se tolera un minuto por el tiempo entre que se llena el formulario y se envía
  if (new Date(fechaEntrega).getTime() < Date.now() - 60 * 1000) {
    throw new BadRequestError(
      "La fecha y hora de entrega no pueden ser anteriores a ahora."
    );
  }

  const id = await tx.ejecutar(async (client) => {
    // El cliente debe tener alguna sucursal activa atendida por esta sucursal
    const clienteActivo = await clientesRepo.estaActivoEnAlcance(
      clienteId,
      actor.sucursal_id,
      client
    );

    if (!clienteActivo) {
      throw new BadRequestError(
        "El cliente no existe o no está activo en tu sucursal."
      );
    }

    // El vendedor debe ser personal de ventas activo de la misma sucursal
    const vendedor = await usuariosRepo.buscarPorId(vendedorId, client);

    if (
      !vendedor ||
      !vendedor.activo ||
      vendedor.rol !== ROLES.VENTAS ||
      vendedor.sucursal_id !== actor.sucursal_id
    ) {
      throw new BadRequestError("El vendedor seleccionado no es válido.");
    }

    const trabajo = await trabajosRepo.insertar(
      {
        indigoSucursalId: actor.sucursal_id,
        opticaId: clienteId,
        vendedorId,
        creadoPorId: actor.id,
        tipoServicio,
        tipoBisel,
        cantidad,
        urgente,
        fechaEntrega,
      },
      client
    );

    return trabajo.id;
  });

  return respuestaTrabajo(id);
}

/* =========================================================
   LABORATORIO: aceptar, terminar, merma y detalles
========================================================= */

async function aceptarTrabajo(actor, id) {
  await tx.ejecutar(async (client) => {
    const trabajo = await cargarTrabajoDeMiSucursal(actor, id, client);

    if (trabajo.estado !== "pendiente") {
      throw new BadRequestError("Solo se puede aceptar un trabajo pendiente.");
    }

    await trabajosRepo.marcarAceptado(id, actor.id, client);
  });

  return respuestaTrabajo(id);
}

async function terminarTrabajo(actor, id) {
  await tx.ejecutar(async (client) => {
    const trabajo = await cargarTrabajoDeMiSucursal(actor, id, client);

    if (trabajo.estado !== "en_proceso") {
      throw new BadRequestError("Solo se puede terminar un trabajo en proceso.");
    }

    await trabajosRepo.marcarTerminado(id, actor.id, client);
  });

  return respuestaTrabajo(id);
}

async function registrarMerma(actor, id, { motivo }) {
  await tx.ejecutar(async (client) => {
    const trabajo = await cargarTrabajoDeMiSucursal(actor, id, client);

    if (trabajo.estado !== "en_proceso") {
      throw new BadRequestError(
        "Solo se puede registrar merma en un trabajo en proceso."
      );
    }

    await trabajosRepo.marcarMerma(id, actor.id, motivo, client);
  });

  return respuestaTrabajo(id);
}

async function agregarDetalle(actor, id, { texto }) {
  await tx.ejecutar(async (client) => {
    const trabajo = await cargarTrabajoDeMiSucursal(actor, id, client);

    if (trabajo.estado !== "en_proceso") {
      throw new BadRequestError(
        "Solo puedes añadir detalles a un trabajo en proceso."
      );
    }

    await trabajosRepo.insertarDetalle(
      { trabajoId: id, texto, creadoPorId: actor.id },
      client
    );
  });

  return respuestaTrabajo(id);
}

module.exports = {
  listarTrabajos,
  obtenerOpciones,
  crearTrabajo,
  aceptarTrabajo,
  terminarTrabajo,
  registrarMerma,
  agregarDetalle,
};