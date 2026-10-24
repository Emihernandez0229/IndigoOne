import { httpClient } from "../../../shared/api/httpClient";
export async function listUsers() {
  return httpClient.get(
    "/api/opticas/usuarios"
  );
}

// Módulo "Personal" (Dueño): da de alta cualquier rol de personal (jefe de
// sucursal o ventas) en cualquier sucursal de la óptica.
export async function createPersonal(payload) {
  return httpClient.post("/api/opticas/usuarios/personal", {
    nombre: payload.name,
    usuario: payload.username,
    telefono: payload.phone,
    correo: payload.email,
    rol: payload.role,
    sucursal_id: payload.branchId || null,
    requiere_cambio_password: payload.passwordChangeRequired,
  });
}

export async function updatePersonal(id, payload) {
  return httpClient.put(`/api/opticas/usuarios/${id}`, {
    nombre: payload.name,
    usuario: payload.username,
    telefono: payload.phone,
    correo: payload.email,
    rol: payload.role,
    sucursal_id: payload.branchId ?? null,
  });
}

export async function deactivateUser(
  id
) {

  return httpClient.patch(`/api/opticas/usuarios/${id}/deactivate`);
}


export async function activateUser(
  id
) {

  return httpClient.patch(`/api/opticas/usuarios/${id}/activate`);
}

