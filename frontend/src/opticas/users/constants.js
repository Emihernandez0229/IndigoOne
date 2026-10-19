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


// Modulo "Personal" (Dueño): solo lista/administra al personal que
// pertenece a una sucursal - no aplica filtrar ni dar de alta otro Dueño.
export const OPTICAS_PERSONAL_ROLES = OPTICAS_USER_ROLES.filter(
  (role) => role.value !== ROLES.OPTICA_DUENO
);


// Modulo "Personal" (Jefe de sucursal): su equipo nunca incluye otro Jefe
// de sucursal - solo puede dar de alta/editar personal operativo (Ventas).
export const MANAGER_PERSONAL_ROLES = OPTICAS_USER_ROLES.filter(
  (role) => role.value === ROLES.OPTICA_EMPLEADO
);


const ROLE_USERNAME_PREFIX = {
  [ROLES.OPTICA_ENCARGADO]: "ENC",
  [ROLES.OPTICA_EMPLEADO]: "VTA",
};

export function generatePersonalUsername(role, existingUsers = []) {
  const prefix = ROLE_USERNAME_PREFIX[role] ?? "USR";
  const sameRoleCount = existingUsers.filter((u) => u.role === role).length;
  return `${prefix}-${String(sameRoleCount + 1).padStart(5, "0")}`;
}
