const { ForbiddenError } = require("../../../core/utils/errors");

const ROLES = {
  SUPER_USUARIO: "super_usuario",
  DUENO: "dueno",
  GERENTE: "gerente_sucursal",
  SUBGERENTE: "subgerente_sucursal",
  VENTAS: "empleado_ventas",
  LABORATORIO: "empleado_laboratorio",
};

// Gerente y subgerente tienen los mismos permisos sobre su sucursal
const ROLES_ENCARGADOS = [ROLES.GERENTE, ROLES.SUBGERENTE];
const ROLES_EMPLEADO = [ROLES.VENTAS, ROLES.LABORATORIO];
const ROLES_SIN_SUCURSAL = [ROLES.SUPER_USUARIO, ROLES.DUENO];

const ETIQUETAS = {
  [ROLES.SUPER_USUARIO]: "Super usuario",
  [ROLES.DUENO]: "Dueño Indigo",
  [ROLES.GERENTE]: "Gerente de sucursal",
  [ROLES.SUBGERENTE]: "Subgerente de sucursal",
  [ROLES.VENTAS]: "Ventas",
  [ROLES.LABORATORIO]: "Laboratorio",
};

const PREFIJOS = {
  [ROLES.SUPER_USUARIO]: "SU",
  [ROLES.DUENO]: "DUE",
  [ROLES.GERENTE]: "GTE",
  [ROLES.SUBGERENTE]: "SGT",
  [ROLES.VENTAS]: "VTA",
  [ROLES.LABORATORIO]: "LAB",
};

// const TIPO_A_ROL = {
//   ventas: ROLES.VENTAS,
//   laboratorio: ROLES.LABORATORIO,
//   subgerente: ROLES.SUBGERENTE,
// };

// Roles que puede crear/asignar cada rol
const PERMISOS = {
  [ROLES.SUPER_USUARIO]: Object.values(ROLES),
  [ROLES.DUENO]: [],
  [ROLES.GERENTE]: [ROLES.SUBGERENTE, ...ROLES_EMPLEADO],
  [ROLES.SUBGERENTE]: ROLES_EMPLEADO,
};

const esEncargado = (rol) => ROLES_ENCARGADOS.includes(rol);

function validarRolPermitido(creadorRol, rolNuevo) {
  const permitidos = PERMISOS[creadorRol] ?? [];

  if (!permitidos.includes(rolNuevo)) {
    throw new ForbiddenError("No tienes permiso para crear o asignar ese rol.");
  }
}

/*
 * Sobre qué usuarios puede actuar quien hace la acción.
 * accion: "editar" | "dar de baja" | "dar de alta"
 */
function validarPuedeGestionar(actor, objetivo, accion) {
  // El dueño no edita; solo da de baja y de alta, y solo a gerentes
  if (actor.rol === ROLES.DUENO) {
    if (accion === "editar" || objetivo.rol !== ROLES.GERENTE) {
      throw new ForbiddenError(`No tienes permiso para ${accion} este usuario.`);
    }
    return;
  }

  // Gerente y subgerente: solo los roles que pueden asignar, en su sucursal
  if (esEncargado(actor.rol)) {
    if (!(PERMISOS[actor.rol] ?? []).includes(objetivo.rol)) {
      throw new ForbiddenError(`No tienes permiso para ${accion} este usuario.`);
    }

    if (objetivo.sucursal_id !== actor.sucursal_id) {
      throw new ForbiddenError(`Solo puedes ${accion} usuarios de tu sucursal.`);
    }
  }
}

// Roles que aparecen en el listado de cada rol (null = todos)
function rolesVisibles(rolActor) {
  if (rolActor === ROLES.SUPER_USUARIO) return null;

  if (rolActor === ROLES.DUENO) {
    return [ROLES.GERENTE, ROLES.SUBGERENTE, ...ROLES_EMPLEADO];
  }

  return PERMISOS[rolActor] ?? [];
}

function opcionesDeRoles(creadorRol) {
  return (PERMISOS[creadorRol] ?? []).map((value) => ({
    value,
    label: ETIQUETAS[value],
  }));
}

module.exports = {
  ROLES,
  ROLES_SIN_SUCURSAL,
  PREFIJOS,
  //TIPO_A_ROL,
  esEncargado,
  validarRolPermitido,
  validarPuedeGestionar,
  rolesVisibles,
  opcionesDeRoles,
};