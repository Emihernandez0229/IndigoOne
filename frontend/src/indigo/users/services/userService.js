/**
 * ==========================================================================
 * MOCK de Usuarios  (se reemplaza por la API real)
 * ==========================================================================
 *
 * Con backend:
 *   list       -> GET    /indigo/users
 *   create     -> POST   /indigo/users
 *   update     -> PUT    /indigo/users/:id
 *   deactivate -> PATCH  /indigo/users/:id/deactivate
 *
 * El backend filtra por el rol del token; el front solo consume.
 * Cada usuario incluye `branchId` para el filtrado por alcance.
 * ==========================================================================
 */

let USERS = [
  { id: 1, branchId: 1, name: "Ana Ramírez", username: "aramirez", role: "INDIGO_BRANCH_MANAGER", branchName: "Sucursal Centro", lastAccess: "2026-09-03 09:12", status: "active" },
  { id: 2, branchId: 1, name: "Luis Gómez", username: "lgomez", role: "INDIGO_SALES", branchName: "Sucursal Centro", lastAccess: "2026-09-03 08:40", status: "active" },
  { id: 3, branchId: 1, name: "Marta Ruiz", username: "mruiz", role: "INDIGO_LAB", branchName: "Sucursal Centro", lastAccess: "2026-09-02 18:05", status: "active" },
  { id: 4, branchId: 2, name: "Julia Torres", username: "jtorres", role: "INDIGO_BRANCH_MANAGER", branchName: "Sucursal Norte", lastAccess: "2026-09-03 07:55", status: "active" },
  { id: 5, branchId: 2, name: "Óscar Lima", username: "olima", role: "INDIGO_SALES", branchName: "Sucursal Norte", lastAccess: "2026-08-28 14:20", status: "inactive" },
  { id: 6, branchId: 3, name: "Diana Cano", username: "dcano", role: "INDIGO_SALES", branchName: "Sucursal Sur", lastAccess: "2026-09-01 11:30", status: "active" },
  { id: 7, branchId: 3, name: "Pablo Senn", username: "psenn", role: "INDIGO_LAB", branchName: "Sucursal Sur", lastAccess: "2026-08-19 16:45", status: "inactive" },
  { id: 8, branchId: 4, name: "Marco Díaz", username: "mdiaz", role: "INDIGO_BRANCH_MANAGER", branchName: "Sucursal Poniente", lastAccess: "2026-08-30 10:10", status: "active" },
  { id: 9, branchId: 5, name: "Sofía Marín", username: "smarin", role: "INDIGO_SALES", branchName: "Sucursal Oriente", lastAccess: "2026-09-02 12:00", status: "active" },
  { id: 10, branchId: 1, name: "Rodrigo Paz", username: "rpaz", role: "INDIGO_OWNER", branchName: "Corporativo", lastAccess: "2026-09-03 09:30", status: "active" },
];


function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


export async function listUsers() {
  await delay();
  return USERS.map((user) => ({ ...user }));
}


export async function createUser(payload) {
  await delay();
  const id = Math.max(0, ...USERS.map((u) => u.id)) + 1;
  const user = {
    id,
    lastAccess: "—",
    status: "active",
    ...payload,
  };
  USERS = [...USERS, user];
  return { ...user };
}


export async function updateUser(id, payload) {
  await delay();
  USERS = USERS.map((user) =>
    user.id === id ? { ...user, ...payload } : user
  );
  return { ...USERS.find((user) => user.id === id) };
}


export async function deactivateUser(id) {
  await delay();
  USERS = USERS.map((user) =>
    user.id === id ? { ...user, status: "inactive" } : user
  );
  return { ...USERS.find((user) => user.id === id) };
}
