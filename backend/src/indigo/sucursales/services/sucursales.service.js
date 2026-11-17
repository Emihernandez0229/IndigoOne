const pool = require("../../../config/db");
const TransactionManager = require("../../../core/database/transaction-manager");
const {
  AppError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} = require("../../../core/utils/errors");

const sucursalesRepo = require("../repositories/sucursales.repository");
const { aSucursalFront } = require("../helpers/sucursales.mapper");
const { ROLES, esEncargado } = require("../../usuarios/helpers/usuarios.permisos");
const {
  crearUsuarioConCredencial,
} = require("../../usuarios/services/usuarios.service");

const tx = new TransactionManager(pool);

/* =========================================================
   HELPERS INTERNOS
========================================================= */

const sucursalNoEncontrada = () => new AppError("Sucursal no encontrada", 404);

/*
 * Si se creó un gerente nuevo, se devuelve su credencial una sola vez
 * (gerente_nuevo) para que el dueño se la entregue.
 */
async function respuestaSucursal(sucursalId, gerente = null) {
  const sucursal = aSucursalFront(await sucursalesRepo.buscarParaFront(sucursalId));

  if (!gerente?.credencial) return sucursal;

  return {
    ...sucursal,
    gerente_nuevo: {
      name: gerente.nombre,
      credencial_provisional: gerente.credencial,
    },
  };
}

/*
 * Asigna un gerente existente (que no tenga sucursal) o crea uno nuevo.
 * Si no se indica ninguno, no hace nada y devuelve null.
 */
async function asignarGerenteEnTransaccion(
  client,
  { sucursalId, gerenteIndigoUsuarioId, nuevoGerenteNombre, creadoPorId }
) {
  if (gerenteIndigoUsuarioId) {
    const libre = await sucursalesRepo.buscarGerenteLibre(
      gerenteIndigoUsuarioId,
      client
    );

    if (!libre) {
      throw new BadRequestError(
        "Ese gerente no existe o ya tiene una sucursal asignada"
      );
    }

    const gerente = await sucursalesRepo.asignarGerenteASucursal(
      gerenteIndigoUsuarioId,
      sucursalId,
      client
    );

    return { id: gerente.id, nombre: gerente.nombre, credencial: null };
  }

  if (nuevoGerenteNombre) {
    const nombre = nuevoGerenteNombre.trim();

    const { id, credencial } = await crearUsuarioConCredencial(client, {
      rol: ROLES.GERENTE,
      nombre,
      sucursalId,
      creadoPorId,
    });

    return { id, nombre, credencial };
  }

  return null;
}

/* =========================================================
   CREAR
========================================================= */

async function crearSucursal(
  actor,
  { nombre, pais, estado, municipio, gerenteIndigoUsuarioId, nuevoGerenteNombre }
) {
  const { sucursalId, gerente } = await tx.ejecutar(async (client) => {
    if (await sucursalesRepo.existePorNombre(nombre, client)) {
      throw new ConflictError("Ya existe una sucursal con ese nombre");
    }

    const sucursal = await sucursalesRepo.crear(
      { nombre, pais, estado, municipio },
      client
    );

    const gerente = await asignarGerenteEnTransaccion(client, {
      sucursalId: sucursal.id,
      gerenteIndigoUsuarioId,
      nuevoGerenteNombre,
      creadoPorId: actor.id,
    });

    return { sucursalId: sucursal.id, gerente };
  });

  return respuestaSucursal(sucursalId, gerente);
}

/* =========================================================
   CONSULTAS
========================================================= */

async function listarGerentesDisponibles(gerenteActualId = null) {
  return sucursalesRepo.listarGerentesDisponibles(gerenteActualId);
}

// async function listarSucursales(actor) {
//   // Gerente y subgerente solo ven su propia sucursal
//   const filtro = esEncargado(actor.rol)
//     ? { sucursalId: actor.sucursal_id }
//     : {};

//   const filas = await sucursalesRepo.listarParaFront(filtro);

//   return filas.map(aSucursalFront);
// }


async function listarSucursales(actor) {
  let filtro = {};

  if (esEncargado(actor.rol)) {
    // Se lee de la BD, no del token: si lo asignaron después de iniciar
    // sesión, el token todavía trae el sucursal_id viejo.
    const { rows } = await pool.query(
      "SELECT sucursal_id FROM indigo_usuarios WHERE id = $1",
      [actor.id]
    );
    filtro = { sucursalId: rows[0]?.sucursal_id ?? null };
  }

  const filas = await sucursalesRepo.listarParaFront(filtro);
  return filas.map(aSucursalFront);
}


/* =========================================================
   CAMBIAR GERENTE
========================================================= */

async function asignarGerente(
  actor,
  sucursalId,
  { gerenteIndigoUsuarioId, nuevoGerenteNombre }
) {
  const gerente = await tx.ejecutar(async (client) => {
    // Bloquear la sucursal durante la operación
    const sucursal = await sucursalesRepo.buscarPorId(sucursalId, client, {
      bloquear: true,
    });

    if (!sucursal) throw sucursalNoEncontrada();

    // Liberar el gerente actual
    await sucursalesRepo.liberarGerentes(sucursalId, client);

    return asignarGerenteEnTransaccion(client, {
      sucursalId,
      gerenteIndigoUsuarioId,
      nuevoGerenteNombre,
      creadoPorId: actor.id,
    });
  });

  return {
    sucursal_id: sucursalId,
    gerente_asignado_id: gerente?.id ?? null,
    gerente_nombre: gerente?.nombre ?? null,
    ...(gerente?.credencial && {
      gerente_nuevo: {
        name: gerente.nombre,
        credencial_provisional: gerente.credencial,
      },
    }),
  };
}

/* =========================================================
   ACTUALIZAR (dueño: nombre, ubicación y responsable)
========================================================= */

async function actualizarSucursal(
  actor,
  sucursalId,
  { nombre, pais, estado, municipio, gerenteIndigoUsuarioId, nuevoGerenteNombre }
) {
  const gerente = await tx.ejecutar(async (client) => {
    const sucursal = await sucursalesRepo.buscarPorId(sucursalId, client, {
      bloquear: true,
    });

    if (!sucursal) throw sucursalNoEncontrada();

    if (
      await sucursalesRepo.existePorNombre(nombre, client, {
        excluirId: sucursalId,
      })
    ) {
      throw new ConflictError("Ya existe una sucursal con ese nombre");
    }

    await sucursalesRepo.actualizarUbicacion(
      sucursalId,
      { nombre, pais, estado, municipio },
      client
    );

    // Solo se toca al gerente si se indicó uno
    if (!gerenteIndigoUsuarioId && !nuevoGerenteNombre) return null;

    await sucursalesRepo.liberarGerentes(sucursalId, client);

    return asignarGerenteEnTransaccion(client, {
      sucursalId,
      gerenteIndigoUsuarioId,
      nuevoGerenteNombre,
      creadoPorId: actor.id,
    });
  });

  return respuestaSucursal(sucursalId, gerente);
}

/* =========================================================
   ACTUALIZAR CONTACTO (gerente/subgerente: dirección y teléfono)
========================================================= */

async function actualizarContacto(actor, sucursalId, { direccion, telefono }) {
  if (esEncargado(actor.rol) && sucursalId !== actor.sucursal_id) {
    throw new ForbiddenError("Solo puedes editar tu propia sucursal");
  }

  const sucursal = await sucursalesRepo.buscarPorId(sucursalId);

  if (!sucursal) throw sucursalNoEncontrada();

  await sucursalesRepo.actualizarContacto(sucursalId, { direccion, telefono });

  return respuestaSucursal(sucursalId);
}

/* =========================================================
   DAR DE BAJA / ALTA
========================================================= */

async function cambiarEstado(sucursalId, activo) {
  const actualizada = await sucursalesRepo.cambiarEstado(sucursalId, activo);

  if (!actualizada) throw sucursalNoEncontrada();

  return respuestaSucursal(sucursalId);
}

const darDeBaja = (sucursalId) => cambiarEstado(sucursalId, false);
const darDeAlta = (sucursalId) => cambiarEstado(sucursalId, true);

module.exports = {
  crearSucursal,
  listarGerentesDisponibles,
  asignarGerente,
  listarSucursales,
  actualizarSucursal,
  actualizarContacto,
  darDeBaja,
  darDeAlta,
};