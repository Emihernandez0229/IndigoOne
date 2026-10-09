import {ROLES} from "../../shared/security/roles";


export const INDIGO_USER_ROLES = [
  {
    value:
      ROLES.INDIGO_SUPER_USUARIO,
    label:
      "Super usuario",
  },
  {
    value:
      ROLES.INDIGO_DUENO,
    label:
      "Dueño Indigo",
  },
  {
    value:
      ROLES.INDIGO_GERENTE_SUCURSAL,
    label:
      "Gerente de sucursal",
  },
  {
    value:
      ROLES.INDIGO_SUBGERENTE,
    label:
      "Subgerente",
  },
  {
    value:
      ROLES.INDIGO_EMPLEADO_VENTAS,
    label:
      "Ventas",
  },
  {
    value:
      ROLES.INDIGO_EMPLEADO_LABORATORIO,
    label:
      "Laboratorio",
  },
];


export const USER_ROLE_LABELS =
  Object.fromEntries(
    INDIGO_USER_ROLES.map(
      (role) => [
        role.value,
        role.label,
      ]
    )
  );


// Modulo "Personal" (Dueño): solo lista al personal que pertenece a una
// sucursal, por lo que no aplica filtrar por Super usuario ni Dueño Indigo.
export const INDIGO_PERSONAL_ROLES = INDIGO_USER_ROLES.filter(
  (role) =>
    role.value !== ROLES.INDIGO_SUPER_USUARIO &&
    role.value !== ROLES.INDIGO_DUENO
);


// Modulo "Empleados" (Gerente/Subgerente): el roster que administran nunca
// incluye al Gerente de sucursal (ni a si mismos), solo a quienes le
// reportan - por eso tambien se usa para las opciones de "Puesto / Rol"
// al crear o editar un empleado.
export const EMPLOYEE_ROLES = INDIGO_USER_ROLES.filter(
  (role) =>
    role.value === ROLES.INDIGO_SUBGERENTE ||
    role.value === ROLES.INDIGO_EMPLEADO_VENTAS ||
    role.value === ROLES.INDIGO_EMPLEADO_LABORATORIO
);


// El Subgerente no puede dar de alta, editar ni filtrar por "Subgerente"
// (no administra a su propio puesto) - el Gerente si conserva esa opcion.
export function getEmployeeRoleOptions(viewerRole) {
  if (viewerRole === ROLES.INDIGO_SUBGERENTE) {
    return EMPLOYEE_ROLES.filter((role) => role.value !== ROLES.INDIGO_SUBGERENTE);
  }
  return EMPLOYEE_ROLES;
}
