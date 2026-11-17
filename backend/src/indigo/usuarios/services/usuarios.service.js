const bcrypt = require("bcrypt");

const pool = require("../../../config/db");
const TransactionManager = require("../../../core/database/transaction-manager");
const {
  generarCredencialUnica,
  generarPasswordTemporal,
} = require("../../../core/utils/credenciales");
const {
  existeUsuarioGlobal,
  registrarCredencialGlobal,
  cambiarUsuarioGlobal,
} = require("../../../core/services/credenciales.service");
const {
  AppError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} = require("../../../core/utils/errors");

const usuariosRepo = require("../repositories/usuarios.repository");
const sucursalesRepo = require("../../sucursales/repositories/sucursales.repository");
const { aUsuarioFront } = require("../helpers/usuarios.mapper");
const {
  ROLES,
  ROLES_SIN_SUCURSAL,
  PREFIJOS,
  esEncargado,
  validarRolPermitido,
  validarPuedeGestionar,
  rolesVisibles,
  opcionesDeRoles,
} = require("../helpers/usuarios.permisos");

const SALT_ROUNDS = 10;
const tx = new TransactionManager(pool);

// Puestos que solo puede ocupar una persona activa por sucursal
const MENSAJE_PUESTO_OCUPADO = {
  [ROLES.GERENTE]: "Esa sucursal ya tiene un gerente asignado.",
  [ROLES.SUBGERENTE]: "Esa sucursal ya tiene un subgerente asignado.",
};

/* =========================================================
   HELPERS INTERNOS
========================================================= */

async function exigirSucursalActiva(client, sucursalId) {
  const sucursal = await sucursalesRepo.buscarActivaPorId(sucursalId, client);

  if (!sucursal) {
    throw new AppError("La sucursal indicada no existe.", 404);
  }
  return sucursal;
}

/*
 * Gerente y subgerente solo operan en su propia sucursal;
 * el super usuario elige una (o conserva la actual al editar).
 */
function resolverSucursalDestino(actor, sucursalId, sucursalActual = null) {
  if (esEncargado(actor.rol)) {
    if (!actor.sucursal_id) {
      throw new BadRequestError("No tienes una sucursal asignada.");
    }
    return actor.sucursal_id;
  }

  const destino = sucursalId || sucursalActual;

  if (!destino) {
    throw new BadRequestError("Debes seleccionar una sucursal.");
  }
  return destino;
}

// Valida la sucursal y que el puesto (gerente/subgerente) no esté ocupado
async function validarSucursalParaRol(client, rol, sucursalId, usuarioId = null) {
  await exigirSucursalActiva(client, sucursalId);

  if (
    MENSAJE_PUESTO_OCUPADO[rol] &&
    (await usuariosRepo.existeRolActivoEnSucursal(
      sucursalId,
      rol,
      usuarioId,
      client
    ))
  ) {
    throw new BadRequestError(MENSAJE_PUESTO_OCUPADO[rol]);
  }
}

/*
 * Genera la credencial (que es a la vez usuario y contraseña inicial),
 * inserta el usuario y la registra globalmente.
 */
async function crearUsuarioConCredencial(
  client,
  {
    rol,
    nombre,
    telefono = null,
    correo = null,
    sucursalId,
    creadoPorId,
    passwordCambiada = false,
  }
) {
  const credencial = await generarCredencialUnica(
    PREFIJOS[rol],
    existeUsuarioGlobal
  );

  const passwordHash = await bcrypt.hash(credencial, SALT_ROUNDS);

  const nuevo = await usuariosRepo.insertar(
    {
      sucursalId,
      nombre,
      usuario: credencial,
      passwordHash,
      rol,
      creadoPorId,
      telefono,
      correo,
      passwordCambiada,
    },
    client
  );

  await registrarCredencialGlobal(client, {
    usuario: credencial,
    tipo: "indigo",
    referenciaId: nuevo.id,
  });

  return { id: nuevo.id, credencial };
}

async function respuestaConCredencial({ id, credencial }) {
  const usuario = await usuariosRepo.buscarParaFront(id);

  return {
    ...aUsuarioFront(usuario),
    credencial_provisional: credencial,
  };
}

// Cambia el usuario de inicio de sesión (usuarios y credenciales)
async function cambiarUsuario(client, { id, usuarioActual, usuarioNuevo }) {
  const normalizado = usuarioNuevo.toUpperCase();

  if (normalizado === usuarioActual) return usuarioActual;

  if (await existeUsuarioGlobal(normalizado)) {
    throw new ConflictError("Ese usuario ya existe en el sistema.");
  }

  await cambiarUsuarioGlobal(client, {
    referenciaId: id,
    tipo: "indigo",
    usuarioNuevo: normalizado,
  });

  return normalizado;
}

/* =========================================================
   BOOTSTRAP
========================================================= */

async function crearPrimerSuperUsuario({ nombre, usuario, password }) {
  if (await usuariosRepo.existeSuperUsuario()) {
    throw new ForbiddenError(
      "Ya existe un super usuario. Este endpoint solo funciona la primera vez."
    );
  }

  const usuarioNormalizado = usuario.toUpperCase();

  if (await existeUsuarioGlobal(usuarioNormalizado)) {
    throw new ConflictError("Ese usuario ya existe en el sistema.");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  return tx.ejecutar(async (client) => {
    const nuevo = await usuariosRepo.insertar(
      {
        sucursalId: null,
        nombre,
        usuario: usuarioNormalizado,
        passwordHash,
        rol: ROLES.SUPER_USUARIO,
        creadoPorId: null,
        passwordCambiada: true, // eligió su propia contraseña
      },
      client
    );

    await registrarCredencialGlobal(client, {
      usuario: usuarioNormalizado,
      tipo: "indigo",
      referenciaId: nuevo.id,
    });

    return nuevo;
  });
}

/* =========================================================
   ALTA
========================================================= */

async function crearUsuario(
  actor,
  { nombre, telefono, correo, rol, sucursalId, requiereCambioPassword = true }
) {
  validarRolPermitido(actor.rol, rol);

  // super usuario y dueño no llevan sucursal
  const sucursalDestino = ROLES_SIN_SUCURSAL.includes(rol)
    ? null
    : resolverSucursalDestino(actor, sucursalId);

  const creado = await tx.ejecutar(async (client) => {
    if (sucursalDestino) {
      await validarSucursalParaRol(client, rol, sucursalDestino);
    }

    return crearUsuarioConCredencial(client, {
      rol,
      nombre,
      telefono,
      correo,
      sucursalId: sucursalDestino,
      creadoPorId: actor.id,
      passwordCambiada: !requiereCambioPassword,
    });
  });

  return respuestaConCredencial(creado);
}

/* =========================================================
   CONSULTAS
========================================================= */

async function obtenerOpcionesFormulario(actor, usuarioEditarId = null) {
  const aOpcion = (s) => ({ value: s.id, label: s.nombre });

  let sucursales = [];

  if (esEncargado(actor.rol)) {
    // Solo ven su propia sucursal
    if (actor.sucursal_id) {
      const propia = await sucursalesRepo.buscarActivaPorId(actor.sucursal_id);
      sucursales = propia ? [propia] : [];
    }
  } else {
    sucursales = await sucursalesRepo.listarActivas();
  }

  // Solo el super usuario puede convertir a alguien en gerente
  const sucursalesGerente =
    actor.rol === ROLES.SUPER_USUARIO
      ? await sucursalesRepo.listarSinGerente(usuarioEditarId)
      : [];

  return {
    roles: opcionesDeRoles(actor.rol),
    sucursales: sucursales.map(aOpcion),
    sucursalesGerente: sucursalesGerente.map(aOpcion),
  };
}

async function obtenerUsuarios(actor) {
  const filas = await usuariosRepo.listar({
    roles: rolesVisibles(actor.rol),
    // gerente y subgerente solo ven su sucursal
    sucursalId: esEncargado(actor.rol) ? actor.sucursal_id : undefined,
  });

  return filas.map(aUsuarioFront);
}

/* =========================================================
   ACTUALIZAR
========================================================= */

async function actualizarUsuario(
  actor,
  usuarioId,
  { nombre, usuario: usuarioNuevo, telefono, correo, rolNuevo, sucursalId }
) {
  await tx.ejecutar(async (client) => {
    const usuario = await usuariosRepo.buscarPorId(usuarioId, client, {
      bloquear: true,
    });

    if (!usuario) {
      throw new AppError("El usuario no existe.", 404);
    }

    if (!usuario.activo) {
      throw new BadRequestError("No puedes editar un usuario inactivo.");
    }

    validarRolPermitido(actor.rol, rolNuevo);
    validarPuedeGestionar(actor, usuario, "editar");

    let sucursalDestino = null;

    // super usuario y dueño no llevan sucursal; el resto sí
    if (!ROLES_SIN_SUCURSAL.includes(rolNuevo)) {
      sucursalDestino = resolverSucursalDestino(
        actor,
        sucursalId,
        usuario.sucursal_id
      );

      await validarSucursalParaRol(
        client,
        rolNuevo,
        sucursalDestino,
        usuario.id
      );
    }

    // Solo el super usuario puede cambiar el usuario de inicio de sesión
    const pideCambioUsuario =
      usuarioNuevo && usuarioNuevo.toUpperCase() !== usuario.usuario;

    if (pideCambioUsuario && actor.rol !== ROLES.SUPER_USUARIO) {
      throw new ForbiddenError("No tienes permiso para cambiar el usuario.");
    }

    const usuarioFinal = pideCambioUsuario
      ? await cambiarUsuario(client, {
          id: usuario.id,
          usuarioActual: usuario.usuario,
          usuarioNuevo,
        })
      : usuario.usuario;

    await usuariosRepo.actualizarDatos(
      usuarioId,
      {
        nombre,
        usuario: usuarioFinal,
        telefono,
        correo,
        rol: rolNuevo,
        sucursalId: sucursalDestino,
      },
      client
    );
  });

  return aUsuarioFront(await usuariosRepo.buscarParaFront(usuarioId));
}

/* =========================================================
   DAR DE BAJA / ALTA
========================================================= */

async function cambiarEstado(actor, usuarioId, activar) {
  const accion = activar ? "dar de alta" : "dar de baja";

  await tx.ejecutar(async (client) => {
    const usuario = await usuariosRepo.buscarPorId(usuarioId, client, {
      bloquear: true,
    });

    if (!usuario) {
      throw new AppError("El usuario no existe.", 404);
    }

    if (usuario.activo === activar) {
      throw new BadRequestError(
        activar ? "El usuario ya está activo." : "El usuario ya está inactivo."
      );
    }

    validarPuedeGestionar(actor, usuario, accion);

    // Nunca se permite dar de baja al propio usuario
    if (!activar && usuarioId === actor.id) {
      throw new ForbiddenError("No puedes dar de baja tu propio usuario.");
    }

    // Al reactivar un gerente/subgerente, su puesto pudo haberse ocupado
    if (
      activar &&
      MENSAJE_PUESTO_OCUPADO[usuario.rol] &&
      (await usuariosRepo.existeRolActivoEnSucursal(
        usuario.sucursal_id,
        usuario.rol,
        usuario.id,
        client
      ))
    ) {
      throw new BadRequestError(MENSAJE_PUESTO_OCUPADO[usuario.rol]);
    }

    await usuariosRepo.cambiarEstado(usuarioId, activar, client);
  });

  return aUsuarioFront(await usuariosRepo.buscarParaFront(usuarioId));
}

const darDeBajaUsuario = (actor, id) => cambiarEstado(actor, id, false);
const darDeAltaUsuario = (actor, id) => cambiarEstado(actor, id, true);

/* =========================================================
   RESTABLECER CONTRASEÑA (solo super usuario)
========================================================= */

async function resetearPassword(actor, usuarioId) {
  if (actor.rol !== ROLES.SUPER_USUARIO) {
    throw new ForbiddenError("No tienes permiso para restablecer contraseñas.");
  }

  const usuario = await usuariosRepo.buscarPorId(usuarioId);

  if (!usuario) {
    throw new AppError("El usuario no existe.", 404);
  }

  const passwordTemporal = generarPasswordTemporal();
  const passwordHash = await bcrypt.hash(passwordTemporal, SALT_ROUNDS);

  // password_cambiada = false: la cambia en su siguiente inicio de sesión
  await usuariosRepo.actualizarPassword(usuarioId, passwordHash, false);

  return { password_temporal: passwordTemporal };
}

/* =========================================================
   MI PERFIL (cualquier usuario de Indigo)
========================================================= */

async function actualizarMiPerfil(actor, { nombre, usuario, telefono, correo }) {
  await tx.ejecutar(async (client) => {
    const yo = await usuariosRepo.buscarPorId(actor.id, client, {
      bloquear: true,
    });

    if (!yo) {
      throw new AppError("El usuario no existe.", 404);
    }

    const usuarioFinal = usuario
      ? await cambiarUsuario(client, {
          id: yo.id,
          usuarioActual: yo.usuario,
          usuarioNuevo: usuario,
        })
      : yo.usuario;

    await usuariosRepo.actualizarPerfil(
      actor.id,
      { nombre, usuario: usuarioFinal, telefono, correo },
      client
    );
  });

  return aUsuarioFront(await usuariosRepo.buscarParaFront(actor.id));
}

async function cambiarMiPassword(actor, { actual, nueva }) {
  const hashActual = await usuariosRepo.buscarPasswordHash(actor.id);

  // Importante: 400 y no 401, porque el front cierra la sesión con cualquier 401
  if (!hashActual || !(await bcrypt.compare(actual, hashActual))) {
    throw new BadRequestError("La contraseña actual es incorrecta.");
  }

  const hashNuevo = await bcrypt.hash(nueva, SALT_ROUNDS);
  await usuariosRepo.actualizarPassword(actor.id, hashNuevo, true);

  return { mensaje: "Contraseña actualizada correctamente" };
}

module.exports = {
  crearUsuarioConCredencial,
  crearPrimerSuperUsuario,
  crearUsuario,
  obtenerUsuarios,
  obtenerOpcionesFormulario,
  actualizarUsuario,
  darDeBajaUsuario,
  darDeAltaUsuario,
  resetearPassword,
  actualizarMiPerfil,
  cambiarMiPassword,
};