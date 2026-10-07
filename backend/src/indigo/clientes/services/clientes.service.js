const bcrypt = require("bcrypt");

const pool = require("../../../config/db");
const TransactionManager = require("../../../core/database/transaction-manager");
const {
  existeUsuarioGlobal,
  registrarCredencialGlobal,
} = require("../../../core/services/credenciales.service");
const {
  AppError,
  ConflictError,
  ForbiddenError,
} = require("../../../core/utils/errors");

const clientesRepo = require("../repositories/clientes.repository");
const sucursalesRepo = require("../../sucursales/repositories/sucursales.repository");
const { ROLES } = require("../../usuarios/helpers/usuarios.permisos");

const SALT_ROUNDS = 10;
const tx = new TransactionManager(pool);

// Quita el hash de la contraseña antes de responder
function sinPassword({ password_hash, ...resto }) {
  return resto;
}

/* =========================================================
   CREAR ÓPTICA (con su dueño)
========================================================= */

async function crearOptica(actor, { codigo, razonSocial, duenoNombre }) {
  const codigoNormalizado = codigo.toUpperCase();

  if (await existeUsuarioGlobal(codigoNormalizado)) {
    throw new ConflictError("Ese código ya está en uso en el sistema, usa otro");
  }

  const passwordHash = await bcrypt.hash(codigoNormalizado, SALT_ROUNDS);

  const { optica, dueno } = await tx.ejecutar(async (client) => {
    const optica = await clientesRepo.insertarOptica(
      {
        codigo: codigoNormalizado,
        razonSocial,
        passwordHash,
        creadoPorId: actor.id,
      },
      client
    );

    const dueno = await clientesRepo.insertarDueno(
      {
        opticaId: optica.id,
        nombre: duenoNombre,
        usuario: codigoNormalizado,
        passwordHash,
      },
      client
    );

    await registrarCredencialGlobal(client, {
      usuario: codigoNormalizado,
      tipo: "optica",
      referenciaId: dueno.id,
    });

    return { optica, dueno };
  });

  return { optica: sinPassword(optica), dueno: sinPassword(dueno) };
}

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

  // El gerente solo asigna clientes a su propia sucursal de Indigo
  if (actor.rol === ROLES.GERENTE && indigoSucursalId !== actor.sucursal_id) {
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

module.exports = { crearOptica, buscarPorCodigo, asignarProveedor };