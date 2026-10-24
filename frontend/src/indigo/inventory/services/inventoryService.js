import { httpClient } from "../../../shared/api/httpClient";

export async function listInventory() {
  return httpClient.get("/api/indigo/inventario");
}

export async function createInventoryItem(payload) {
  return httpClient.post("/api/indigo/inventario", {
    codigo: payload.code,
    modelo: payload.model,
    descripcion: payload.description,
    color: payload.color,
    tipo: payload.type,
    material: payload.material,
    genero: payload.gender,
    medidas: payload.measurements,
    stock_disponible: payload.stockAvailable,
    stock_minimo: payload.stockMin,
    costo: payload.cost,
    sucursal_id: payload.branchId || null,
    fotos: payload.photos || [],
  });
}

export async function updateInventoryItem(id, payload) {
  return httpClient.put(`/api/indigo/inventario/${id}`, {
    codigo: payload.code,
    modelo: payload.model,
    descripcion: payload.description,
    color: payload.color,
    tipo: payload.type,
    material: payload.material,
    genero: payload.gender,
    medidas: payload.measurements,
    stock_disponible: payload.stockAvailable,
    stock_minimo: payload.stockMin,
    costo: payload.cost,
    fotos: payload.photos || [],
  });
}

export async function deactivateInventoryItem(id) {
  return httpClient.patch(`/api/indigo/inventario/${id}/deactivate`);
}

export async function activateInventoryItem(id) {
  return httpClient.patch(`/api/indigo/inventario/${id}/activate`);
}
