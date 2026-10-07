import {ROLES} from "../../shared/security/roles";


export const OPTICAS_USER_ROLES = [
  {
    value:
      ROLES.OPTICA_DUENO,
    label:
      "Dueño",
  },
  {
    value:
      ROLES.OPTICA_ENCARGADO,
    label:
      "Jefe de sucursal",
  },
  {
    value:
      ROLES.OPTICA_EMPLEADO,
    label:
      "Ventas",
  },
];


export const USER_ROLE_LABELS =
  Object.fromEntries(
    OPTICAS_USER_ROLES.map(
      (role) => [
        role.value,
        role.label,
      ]
    )
  );
