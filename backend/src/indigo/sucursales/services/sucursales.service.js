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
const { ROLES } = require("../../usuarios/helpers/usuarios.permisos");
const {
  crearUsuarioConCredencial,
} = require("../../usuarios/services/usuarios.service");

const tx = new TransactionManager(pool);

/* =========================================================
   HELPERS INTERNOS
========================================================= */

const sucursalNoEncontrada = () => new AppError("Sucursal no encontrada", 404);

async function respuestaSucursal(sucursalId) {
  return aSucursalFront(await sucursalesRepo.buscarParaFront(sucursalId));
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

    return sucursalesRepo.asignarGerenteASucursal(
      gerenteIndigoUsuarioId,
      sucursalId,
      client
    );
  }

  if (nuevoGerenteNombre && nuevoGerenteNombre.trim()) {
    const nombre = nuevoGerenteNombre.trim();

    const { id } = await crearUsuarioConCredencial(client, {
      rol: ROLES.GERENTE,
      nombre,
      sucursalId,
      creadoPorId,
    });

    return { id, nombre };
  }

  return null;
}

/* =========================================================
   CREAR
========================================================= */

async function crearSucursal(
  actor,
  { nombre, direccion, telefono, gerenteIndigoUsuarioId, nuevoGerenteNombre }
) {
  const sucursalId = await tx.ejecutar(async (client) => {
    if (await sucursalesRepo.existePorNombre(nombre, client)) {
      throw new ConflictError("Ya existe una sucursal con ese nombre");
    }

    const sucursal = await sucursalesRepo.crear(
      {
        nombre,
        direccion: direccion || null,
        telefono: telefono || null,
      },
      client
    );

    await asignarGerenteEnTransaccion(client, {
      sucursalId: sucursal.id,
      gerenteIndigoUsuarioId,
      nuevoGerenteNombre,
      creadoPorId: actor.id,
    });

    return sucursal.id;
  });

  return respuestaSucursal(sucursalId);
}

/* =========================================================
   CONSULTAS
========================================================= */

async function listarGerentesDisponibles(gerenteActualId = null) {
  return sucursalesRepo.listarGerentesDisponibles(gerenteActualId);
}

async function listarSucursales(actor) {
  // El gerente solo ve su propia sucursal
  const filtro =
    actor.rol === ROLES.GERENTE ? { sucursalId: actor.sucursal_id } : {};

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
  };
}

/* =========================================================
   ACTUALIZAR
========================================================= */

async function actualizarSucursal(
  actor,
  sucursalId,
  { nombre, direccion, telefono, gerenteIndigoUsuarioId, nuevoGerenteNombre }
) {
  /*
   * El gerente solo puede editar dirección y teléfono de su propia
   * sucursal: no la renombra ni cambia al gerente.
   */
  const esGerente = actor.rol === ROLES.GERENTE;

  if (esGerente) {
    if (sucursalId !== actor.sucursal_id) {
      throw new ForbiddenError("Solo puedes editar tu propia sucursal");
    }

    const actual = await sucursalesRepo.buscarPorId(sucursalId);
    if (!actual) throw sucursalNoEncontrada();

    // No puede renombrar, se conserva el nombre actual
    nombre = actual.nombre;
  }

  await tx.ejecutar(async (client) => {
    if (
      await sucursalesRepo.existePorNombre(nombre, client, {
        excluirId: sucursalId,
      })
    ) {
      throw new ConflictError("Ya existe una sucursal con ese nombre");
    }

    const sucursal = await sucursalesRepo.buscarPorId(sucursalId, client, {
      bloquear: true,
    });

    if (!sucursal) throw sucursalNoEncontrada();

    await sucursalesRepo.actualizarDatos(
      sucursalId,
      {
        nombre,
        direccion: direccion || null,
        telefono: telefono || null,
      },
      client
    );

    // El gerente no toca al gerente de la sucursal
    if (!esGerente) {
      await sucursalesRepo.liberarGerentes(sucursalId, client);

      await asignarGerenteEnTransaccion(client, {
        sucursalId,
        gerenteIndigoUsuarioId,
        nuevoGerenteNombre,
        creadoPorId: actor.id,
      });
    }
  });

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
  darDeBaja,
  darDeAlta,
};