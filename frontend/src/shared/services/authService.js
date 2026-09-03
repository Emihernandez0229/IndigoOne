import { ROLES } from "../security/roles";

import { getPermissionsForRole } from "../security/accessControl";


const STORAGE_KEY = "indigo_one.session";


/**
 * ==========================================================================
 * MOCK DE LOGIN  (se reemplaza por la llamada real al backend)
 * ==========================================================================
 *
 * Con backend, loginRequest queda asi:
 *
 *   const { data } = await api.post("/auth/login", credentials); // { username, password }
 *   persistSession(data, credentials.recordarme);                // data = { token, user }
 *   return data;
 *
 * El backend debe devolver:
 *   { token, user: { id, name, username, role, branch, branchIds, permissions } }
 *
 *   - permissions: string[]  (ver security/permissions.js como referencia)
 *   - branchIds:   number[]  sucursales que el usuario puede ver
 *                            (el dueño Indigo puede recibir null = todas)
 * ==========================================================================
 */

// Cambia este rol para probar cada vista mientras no hay backend:
// INDIGO_OWNER / INDIGO_BRANCH_MANAGER / INDIGO_SALES / INDIGO_LAB / OPTICA_OWNER ...
const MOCK_ROLE = ROLES.INDIGO_OWNER;


// Alcance de sucursales por rol para el mock.
const MOCK_BRANCH_SCOPE = {
  [ROLES.INDIGO_OWNER]: null,          // todas
  [ROLES.INDIGO_BRANCH_MANAGER]: [1, 2],
};


export async function loginRequest(credentials) {

  const role = MOCK_ROLE;

  const branchIds = MOCK_BRANCH_SCOPE[role] ?? [1];

  const session = {

    token: "mock-token",

    user: {
      id: 1,
      name: "Usuario Demo",
      username: credentials?.username ?? "demo",
      role,
      branch: { id: 1, name: "Sucursal Centro" },
      branchIds,
      permissions: getPermissionsForRole(role),
    },

  };

  persistSession(session, credentials?.recordarme ?? true);

  return session;

}


/**
 * Guarda la sesion. Si `remember` es false usa sessionStorage.
 */
export function persistSession(session, remember = true) {

  try {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Almacenamiento bloqueado: seguimos solo en memoria.
  }

}


export function readStoredSession() {

  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      sessionStorage.getItem(STORAGE_KEY);

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }

}


export function clearStoredSession() {

  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // sin accion
  }

}


export function getToken() {

  return readStoredSession()?.token ?? null;

}
