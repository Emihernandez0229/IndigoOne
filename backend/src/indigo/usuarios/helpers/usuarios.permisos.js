const { ForbiddenError } = require("../../../core/utils/errors");

const ROLES = {
  SUPER_USUARIO: "super_usuario",
  DUENO: "dueno",
  GERENTE: "gerente_sucursal",
  VENTAS: "empleado_ventas",
  LABORATORIO: "empleado_laboratorio",
};

const ROLES_EMPLEADO = [ROLES.VENTAS, ROLES.LABORATORIO];

const ETIQUETAS = {
  [ROLES.SUPER_USUARIO]: "Super usuario",
  [ROLES.DUENO]: "Dueño Indigo",
  [ROLES.GERENTE]: "Gerente de sucursal",
  [ROLES.VENTAS]: "Ventas",
  [ROLES.LABORATORIO]: "Laboratorio",
};

const PREFIJOS = {
  [ROLES.SUPER_USUARIO]: "SU",
  [ROLES.DUENO]: "DUE",
  [ROLES.GERENTE]: "GTE",
  [ROLES.VENTAS]: "VTA",
  [ROLES.LABORATORIO]: "LAB",
};

const TIPO_EMPLEADO_A_ROL = {
  ventas: ROLES.VENTAS,
  laboratorio: ROLES.LABORATORIO,
};

// Roles que puede crear/asignar cada rol
const PERMISOS = {
  [ROLES.SUPER_USUARIO]: [
    ROLES.SUPER_USUARIO,
    ROLES.DUENO,
    ROLES.GERENTE,
    ROLES.VENTAS,
    ROLES.LABORATORIO,
  ],
  [ROLES.DUENO]: [ROLES.GERENTE, ...ROLES_EMPLEADO],
  [ROLES.GERENTE]: ROLES_EMPLEADO,
};

function validarRolPermitido(creadorRol, rolNuevo) {
  const permitidos = PERMISOS[creadorRol] ?? [];

  if (!permitidos.includes(rolNuevo)) {
    throw new ForbiddenError("No tienes permiso para crear o asignar ese rol.");
  }
}


function validarPuedeGestionar(actor, objetivo, accion) {
  if (
    actor.rol === ROLES.DUENO &&
    [ROLES.SUPER_USUARIO, ROLES.DUENO].includes(objetivo.rol)
  ) {
    throw new ForbiddenError(`No tienes permiso para ${accion} este usuario.`);
  }

  if (actor.rol === ROLES.GERENTE) {
    if (!ROLES_EMPLEADO.includes(objetivo.rol)) {
      throw new ForbiddenError(`No tienes permiso para ${accion} este usuario.`);
    }

    if (objetivo.sucursal_id !== actor.sucursal_id) {
      throw new ForbiddenError(`Solo puedes ${accion} usuarios de tu sucursal.`);
    }
  }
}

function opcionesDeRoles(creadorRol) {
  return (PERMISOS[creadorRol] ?? []).map((value) => ({
    value,
    label: ETIQUETAS[value],
  }));
}

module.exports = {
  ROLES,
  PREFIJOS,
  TIPO_EMPLEADO_A_ROL,
  validarRolPermitido,
  validarPuedeGestionar,
  opcionesDeRoles,
};