// export const ROLES = {


//   // INDIGO

//   INDIGO_OWNER: "INDIGO_OWNER",

//   INDIGO_BRANCH_MANAGER: "INDIGO_BRANCH_MANAGER",

//   INDIGO_SALES: "INDIGO_SALES",

//   INDIGO_LAB: "INDIGO_LAB",



//   // OPTICAS

//   OPTICA_OWNER: "OPTICA_OWNER",

//   OPTICA_BRANCH_MANAGER: "OPTICA_BRANCH_MANAGER",

//   OPTICA_EMPLOYEE: "OPTICA_EMPLOYEE",


// };


export const ROLES = {
  // INDIGO
  INDIGO_SUPER_USUARIO: "indigo:super_usuario",
  INDIGO_DUENO: "indigo:dueno",
  INDIGO_GERENTE_SUCURSAL: "indigo:gerente_sucursal",
  INDIGO_EMPLEADO_VENTAS: "indigo:empleado_ventas",
  INDIGO_EMPLEADO_LABORATORIO: "indigo:empleado_laboratorio",
  // OPTICAS
  OPTICA_DUENO: "optica:dueno",
  OPTICA_ENCARGADO: "optica:encargado",
  OPTICA_EMPLEADO: "optica:empleado",
};

export function buildRoleKey(tipo, rol) {
  return `${tipo}:${rol}`;
}