import { httpClient } from "../../../shared/api/httpClient";

export async function listBranches() {return httpClient.get("/api/indigo/sucursales");}

export async function createBranch(payload) {
  return httpClient.post("/api/indigo/sucursales",
    {
      nombre: payload.name,
      direccion: payload.address,
      telefono: payload.phone,

      gerente_indigo_usuario_id:
        payload.managerMode === "existing"
          ? payload.managerId
          : null,

      nuevo_gerente_nombre:
        payload.managerMode === "new"
          ? payload.manager
          : null,
    }
  );
}


export async function updateBranch(
  id,
  payload
) {

  return httpClient.put(`/api/indigo/sucursales/${id}`,
    {
      nombre: payload.name,
      direccion: payload.address,
      telefono: payload.phone,

      gerente_indigo_usuario_id:
        payload.managerMode === "existing"
          ? payload.managerId
          : null,

      nuevo_gerente_nombre:
        payload.managerMode === "new"
          ? payload.manager
          : null,
    }
  );
}


export async function deactivateBranch(id) {
  return httpClient.patch(`/api/indigo/sucursales/${id}/deactivate`);
}


export async function activateBranch(id) {
  return httpClient.patch(`/api/indigo/sucursales/${id}/activate`);
}


export async function listAvailableManagers(currentManagerId = null) {
  const query = currentManagerId ? `?gerente_actual_id=${currentManagerId}` : "";
  return httpClient.get(`/api/indigo/sucursales/gerentes-disponibles${query}`);
}

export async function assignManager(
  branchId,
  payload
) {

  return httpClient.post(`/api/indigo/sucursales/${branchId}/asignar-gerente`,
    {
      gerente_indigo_usuario_id:
        payload.managerMode === "existing"
          ? payload.managerId
          : null,

      nuevo_gerente_nombre:
        payload.managerMode === "new"
          ? payload.manager
          : null,
    }
  );
}