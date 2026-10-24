import { httpClient } from "../../../shared/api/httpClient";


export async function listClients() {
  return httpClient.get("/api/indigo/clientes");
}


export async function createClient(payload) {
  return httpClient.post("/api/indigo/clientes", {
    nombre_comercial: payload.name,
    razon_social: payload.businessName,
    rfc: payload.rfc,
    telefono: payload.phone,
    correo: payload.email,
    pais: payload.country,
    estado: payload.state,
    municipio: payload.municipality,
    direccion: payload.address,
    codigo_postal: payload.postalCode,
    sucursal_cliente_nombre: payload.branchLocationName,
    indigo_sucursal_id: payload.branchId,
    indigo_sucursal_nombre: payload.branchName,
  });
}


export async function updateClient(id, payload) {
  return httpClient.put(`/api/indigo/clientes/${id}`, {
    nombre_comercial: payload.name,
    razon_social: payload.businessName,
    rfc: payload.rfc,
    telefono: payload.phone,
    correo: payload.email,
    pais: payload.country,
    estado: payload.state,
    municipio: payload.municipality,
    direccion: payload.address,
    codigo_postal: payload.postalCode,
  });
}


export async function deactivateClient(id) {
  return httpClient.patch(`/api/indigo/clientes/${id}/deactivate`);
}


export async function activateClient(id) {
  return httpClient.patch(`/api/indigo/clientes/${id}/activate`);
}
