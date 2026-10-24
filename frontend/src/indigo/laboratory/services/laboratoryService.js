import { httpClient } from "../../../shared/api/httpClient";


export async function listLaboratoryJobs() {
  return httpClient.get("/api/indigo/laboratorio");
}


// Usado por el Empleado de Ventas al registrar un trabajo nuevo.
export async function createLaboratoryJob(payload) {
  return httpClient.post("/api/indigo/laboratorio", {
    sucursal_id: payload.branchId,
    cliente_nombre: payload.clientName,
    vendedor_nombre: payload.sellerName,
    tipo_bisel: payload.biselType,
    tipo_trabajo: payload.serviceType,
    cantidad: payload.quantity,
    tipo_servicio: payload.urgent ? "urgente" : "normal",
    fecha_entrega: payload.deliveryDate,
    hora_entrega: payload.deliveryTime,
    registrado_por_nombre: payload.registeredByName,
    registrado_por_id: payload.registeredById,
  });
}


// Acciones del Empleado de Laboratorio sobre un trabajo ya registrado.
export async function acceptLaboratoryJob(id, employeeName) {
  return httpClient.patch(`/api/indigo/laboratorio/${id}/aceptar`, { nombre: employeeName });
}


export async function completeLaboratoryJob(id, employeeName) {
  return httpClient.patch(`/api/indigo/laboratorio/${id}/terminar`, { nombre: employeeName });
}


export async function registerLaboratoryJobLoss(id, employeeName, reason) {
  return httpClient.patch(`/api/indigo/laboratorio/${id}/merma`, { nombre: employeeName, motivo: reason });
}


export async function addLaboratoryJobDetail(id, employeeName, text) {
  return httpClient.post(`/api/indigo/laboratorio/${id}/detalles`, { nombre: employeeName, texto: text });
}
