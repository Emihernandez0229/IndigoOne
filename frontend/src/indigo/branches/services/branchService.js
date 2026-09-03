/**
 * ==========================================================================
 * MOCK de Sucursales  (se reemplaza por la API real)
 * ==========================================================================
 *
 * Con backend:
 *   list     -> GET    /indigo/branches
 *   create   -> POST   /indigo/branches
 *   update   -> PUT    /indigo/branches/:id
 *   deactivate -> PATCH /indigo/branches/:id/deactivate
 *
 * El backend filtra por el rol del token; el front solo consume.
 * Cada sucursal incluye `branchId` (= id) para el filtrado por alcance.
 * ==========================================================================
 */

let BRANCHES = [
  { id: 1, branchId: 1, name: "Sucursal Centro", address: "Av. Juárez 120, Col. Centro", manager: "Ana Ramírez", phone: "555-101-2020", products: 420, staff: 12, status: "active" },
  { id: 2, branchId: 2, name: "Sucursal Norte", address: "Blvd. Norte 45, Col. Industrial", manager: "Luis Gómez", phone: "555-102-3030", products: 310, staff: 9, status: "active" },
  { id: 3, branchId: 3, name: "Sucursal Sur", address: "Calz. del Sur 890, Col. Jardines", manager: "Julia Torres", phone: "555-103-4040", products: 275, staff: 8, status: "active" },
  { id: 4, branchId: 4, name: "Sucursal Poniente", address: "Av. Poniente 12, Col. Reforma", manager: "Marco Díaz", phone: "555-104-5050", products: 190, staff: 6, status: "inactive" },
  { id: 5, branchId: 5, name: "Sucursal Oriente", address: "Calle Oriente 300, Col. Del Valle", manager: "Sofía Marín", phone: "555-105-6060", products: 205, staff: 7, status: "active" },
  { id: 6, branchId: 6, name: "Sucursal Aeropuerto", address: "Zona Aeropuerto T2, Local 14", manager: "Diego Peña", phone: "555-106-7070", products: 140, staff: 5, status: "inactive" },
];


function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


export async function listBranches() {
  await delay();
  return BRANCHES.map((branch) => ({ ...branch }));
}


export async function createBranch(payload) {
  await delay();
  const id = Math.max(0, ...BRANCHES.map((b) => b.id)) + 1;
  const branch = {
    id,
    branchId: id,
    products: 0,
    staff: 0,
    status: "active",
    ...payload,
  };
  BRANCHES = [...BRANCHES, branch];
  return { ...branch };
}


export async function updateBranch(id, payload) {
  await delay();
  BRANCHES = BRANCHES.map((branch) =>
    branch.id === id ? { ...branch, ...payload } : branch
  );
  return { ...BRANCHES.find((branch) => branch.id === id) };
}


export async function deactivateBranch(id) {
  await delay();
  BRANCHES = BRANCHES.map((branch) =>
    branch.id === id ? { ...branch, status: "inactive" } : branch
  );
  return { ...BRANCHES.find((branch) => branch.id === id) };
}
