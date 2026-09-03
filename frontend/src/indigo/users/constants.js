import { ROLES } from "../../shared/security/roles";


/**
 * Roles Indigo disponibles para el filtro y el formulario de usuarios.
 */
export const INDIGO_USER_ROLES = [
  { value: ROLES.INDIGO_OWNER, label: "Dueño Indigo" },
  { value: ROLES.INDIGO_BRANCH_MANAGER, label: "Jefe de sucursal" },
  { value: ROLES.INDIGO_SALES, label: "Ventas" },
  { value: ROLES.INDIGO_LAB, label: "Laboratorio" },
];


export const USER_ROLE_LABELS = Object.fromEntries(
  INDIGO_USER_ROLES.map((role) => [role.value, role.label])
);


export const USER_STATUSES = [
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
];
