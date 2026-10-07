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


// Modulo "Personal": solo lista al personal que pertenece a una sucursal,
// por lo que no aplica filtrar por Super usuario ni Dueño Indigo.
export const INDIGO_PERSONAL_ROLES = INDIGO_USER_ROLES.filter(
  (role) =>
    role.value !== ROLES.INDIGO_SUPER_USUARIO &&
    role.value !== ROLES.INDIGO_DUENO
);
