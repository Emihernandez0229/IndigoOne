import { httpClient } from "../../../shared/api/httpClient";
import { buildRoleKey } from "../../../shared/security/roles";


function mapUser(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.nombre ?? "",
    username: raw.usuario ?? "",
    phone: raw.telefono ?? "",
    email: raw.email ?? "",
    role: buildRoleKey("optica", raw.rol),
    branchId: raw.sucursal_id ?? null,
    status: raw.activo ? "active" : "inactive",
    createdAt: raw.created_at ?? null,
    // Solo viene en la respuesta de creación (ver crearGerente/crearEmpleado
    // del back): usuario y contraseña temporal son el mismo valor, y es la
    // única vez que la contraseña en texto plano es visible.
    credencialProvisional: raw.credencial_provisional ?? null,
  };
}


// El back no manda el nombre de la sucursal en /usuarios (solo sucursal_id)
// - se resuelve aquí contra la lista de sucursales ya cargada en la página.
export function withBranchNames(users, branches = []) {
  const nameById = new Map(branches.map((b) => [String(b.id), b.name]));
  return users.map((user) => ({
    ...user,
    branchName: user.branchId ? nameById.get(String(user.branchId)) ?? "—" : "—",
  }));
}


export async function listUsers() {
  const usuarios = await httpClient.get("/api/opticas/usuarios");
  return (usuarios ?? []).map(mapUser);
}


// Alta de Jefe de sucursal (solo Dueño) - nunca se manda sucursal: el back
// lo crea sin asignar y se asigna una sucursal después, desde el módulo
// Sucursales. El back genera usuario y contraseña (ver credencialProvisional).
export async function createGerente(payload) {
  const creado = await httpClient.post("/api/opticas/usuarios/gerentes", {
    nombre: payload.name,
    telefono: payload.phone || undefined,
    email: payload.email || undefined,
  });
  return mapUser(creado);
}


// Alta de Ventas (Dueño en cualquier sucursal, Jefe de sucursal solo en la
// suya) - aquí sí es obligatoria la sucursal. El back genera usuario y
// contraseña igual que crearGerente.
export async function createEmpleado(payload) {
  const creado = await httpClient.post("/api/opticas/usuarios/empleados", {
    nombre: payload.name,
    telefono: payload.phone || undefined,
    email: payload.email || undefined,
    sucursal_id: payload.branchId,
  });
  return mapUser(creado);
}


// El back solo permite editar nombre/teléfono/correo (ni el rol ni la
// sucursal se pueden cambiar desde aquí - ver actualizarUsuarioSchema).
export async function updatePersonal(id, payload) {
  const actualizado = await httpClient.patch(`/api/opticas/usuarios/${id}`, {
    nombre: payload.name,
    telefono: payload.phone || undefined,
    email: payload.email || undefined,
  });
  return mapUser(actualizado);
}


export async function deactivateUser(id) {
  const actualizado = await httpClient.patch(`/api/opticas/usuarios/${id}`, { activo: false });
  return mapUser(actualizado);
}


export async function activateUser(id) {
  const actualizado = await httpClient.patch(`/api/opticas/usuarios/${id}`, { activo: true });
  return mapUser(actualizado);
}


// "Mi perfil" (todos los roles): mismo endpoint que editar personal, cada
// quien edita su propia fila.
export async function updateMyProfile(id, payload) {
  const actualizado = await httpClient.patch(`/api/opticas/usuarios/${id}`, {
    nombre: payload.name,
    telefono: payload.phone || undefined,
    email: payload.email || undefined,
  });
  return mapUser(actualizado);
}
