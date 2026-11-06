import { httpClient } from "../../../shared/api/httpClient";
import { ROLES } from "../../../shared/security/roles";


function mapBranch(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.nombre ?? "",
    address: raw.direccion ?? "",
    phone: raw.telefono ?? "",
    status: raw.activo ? "active" : "inactive",
    createdAt: raw.created_at ?? null,
  };
}


// El back no manda el gerente pegado a la sucursal (la relación vive en
// sucursal_gerentes) - se resuelve cruzando con Personal: el encargado
// cuyo sucursal_id coincida con esta sucursal es su gerente (el back ya
// mantiene ese campo al asignar/cambiar gerente, ver sucursales.repository.js
// asignarSucursalAUsuario). `users` es lo que ya regresa useUsers().
export function withManagerInfo(branches, users = []) {
  const managerByBranch = new Map(
    users
      .filter((u) => u.role === ROLES.OPTICA_ENCARGADO && u.branchId)
      .map((u) => [u.branchId, u])
  );
  return branches.map((b) => {
    const manager = managerByBranch.get(b.id);
    return {
      ...b,
      managerId: manager?.id ?? null,
      manager: manager?.name ?? "",
      managerPhone: manager?.phone ?? "",
    };
  });
}


// "Personal"/"Pacientes"/"Productos" tampoco vienen en la sucursal - se
// cuentan aquí con lo que ya cargan BranchesPage/MyBranchPage (useUsers,
// usePatients, useProductos), igual criterio que withManagerInfo.
export function withBranchCounts(branches, { users = [], patients = [], productos = [] } = {}) {
  return branches.map((b) => ({
    ...b,
    staff: users.filter((u) => u.branchId === b.id).length,
    staffList: users
      .filter((u) => u.branchId === b.id)
      .map((u) => ({ name: u.name, role: u.role })),
    customers: patients.filter((p) => p.branchId === b.id).length,
    products: productos.filter((p) => p.active && p.stockPorSucursal?.some((s) => s.branchId === b.id && s.stock > 0)).length,
  }));
}


export async function listBranches() {
  const sucursales = await httpClient.get("/api/opticas/sucursales");
  return (sucursales ?? []).map(mapBranch);
}


// Alta de sucursal (Dueño) - el back no soporta crear un jefe de sucursal
// nuevo al mismo tiempo (crearSucursalSchema es estricto), solo asignar
// uno que ya exista o dejarla sin asignar. La respuesta es
// {sucursal, gerente_asignado}, no la sucursal sola.
export async function createBranch(payload) {
  const creado = await httpClient.post("/api/opticas/sucursales", {
    nombre: payload.name,
    gerente_optica_usuario_id: payload.managerId || undefined,
  });
  return mapBranch(creado.sucursal);
}


// Edición de sucursal (Dueño) - el back solo permite nombre/dirección/
// teléfono por aquí; el gerente se asigna/cambia por su propio endpoint
// (ver assignManager/changeManager), nunca junto con el nombre.
export async function updateBranch(id, payload) {
  const sucursal = await httpClient.patch(`/api/opticas/sucursales/${id}`, {
    nombre: payload.name,
  });
  return mapBranch(sucursal);
}


// Edición acotada que usa el Encargado desde "Mi sucursal": solo dirección
// y teléfono - nunca nombre, responsable ni ubicación (eso es del Dueño).
export async function updateBranchContact(id, payload) {
  const sucursal = await httpClient.patch(`/api/opticas/sucursales/${id}`, {
    direccion: payload.address,
    telefono: payload.phone,
  });
  return mapBranch(sucursal);
}


export async function deactivateBranch(id) {
  const sucursal = await httpClient.patch(`/api/opticas/sucursales/${id}/desactivar`);
  return mapBranch(sucursal);
}


export async function activateBranch(id) {
  const sucursal = await httpClient.patch(`/api/opticas/sucursales/${id}/activar`);
  return mapBranch(sucursal);
}


export async function listAvailableManagers(currentManagerId = null) {
  const query = currentManagerId ? `?gerente_actual_id=${currentManagerId}` : "";
  return httpClient.get(`/api/opticas/sucursales/gerentes-disponibles${query}`);
}


// Asignar gerente - solo funciona si la sucursal TODAVÍA NO tiene uno
// (el back responde 409 si ya tiene).
export async function assignManager(branchId, managerId) {
  return httpClient.post("/api/opticas/sucursales/gerente", {
    sucursal_id: branchId,
    optica_usuario_id: managerId,
  });
}


// Cambiar gerente - solo funciona si la sucursal YA tiene uno (lo
// reemplaza; el back responde 409 si no tiene ninguno todavía).
export async function changeManager(branchId, managerId) {
  return httpClient.patch(`/api/opticas/sucursales/${branchId}/gerente`, {
    optica_usuario_id: managerId,
  });
}
