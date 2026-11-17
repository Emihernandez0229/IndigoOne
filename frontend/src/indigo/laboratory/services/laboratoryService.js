// import { httpClient } from "../../../shared/api/httpClient";


// export async function listLaboratoryJobs() {
//   return httpClient.get("/api/indigo/laboratorio");
// }


// // Usado por el Empleado de Ventas al registrar un trabajo nuevo.
// export async function createLaboratoryJob(payload) {
//   return httpClient.post("/api/indigo/laboratorio", {
//     sucursal_id: payload.branchId,
//     cliente_nombre: payload.clientName,
//     vendedor_nombre: payload.sellerName,
//     tipo_bisel: payload.biselType,
//     tipo_trabajo: payload.serviceType,
//     cantidad: payload.quantity,
//     tipo_servicio: payload.urgent ? "urgente" : "normal",
//     fecha_entrega: payload.deliveryDate,
//     hora_entrega: payload.deliveryTime,
//     registrado_por_nombre: payload.registeredByName,
//     registrado_por_id: payload.registeredById,
//   });
// }


// // Acciones del Empleado de Laboratorio sobre un trabajo ya registrado.
// export async function acceptLaboratoryJob(id, employeeName) {
//   return httpClient.patch(`/api/indigo/laboratorio/${id}/aceptar`, { nombre: employeeName });
// }


// export async function completeLaboratoryJob(id, employeeName) {
//   return httpClient.patch(`/api/indigo/laboratorio/${id}/terminar`, { nombre: employeeName });
// }


// export async function registerLaboratoryJobLoss(id, employeeName, reason) {
//   return httpClient.patch(`/api/indigo/laboratorio/${id}/merma`, { nombre: employeeName, motivo: reason });
// }


// export async function addLaboratoryJobDetail(id, employeeName, text) {
//   return httpClient.post(`/api/indigo/laboratorio/${id}/detalles`, { nombre: employeeName, texto: text });
// }


import { httpClient } from "../../../shared/api/httpClient";

const BASE = "/api/indigo/trabajos";


export async function listLaboratoryJobs() {
  return httpClient.get(BASE);
}


// Clientes de la sucursal y vendedores (yo, primero) para el formulario de ventas
export async function getJobFormOptions() {
  return httpClient.get(`${BASE}/opciones`);
}


export async function createLaboratoryJob(payload) {
  return httpClient.post(BASE, {
    cliente_id: payload.clientId,
    vendedor_id: payload.sellerId,
    tipo_servicio: payload.serviceType,
    tipo_bisel: payload.biselType,
    cantidad: payload.quantity,
    urgente: payload.urgent,
    // Con la zona horaria del navegador, para que el servidor no la adivine
    fecha_entrega: new Date(`${payload.deliveryDate}T${payload.deliveryTime}`).toISOString(),
  });
}


// El nombre de quien lo hace ya no se manda: el back lo toma del token.
export async function acceptLaboratoryJob(id) {
  return httpClient.patch(`${BASE}/${id}/aceptar`);
}


export async function completeLaboratoryJob(id) {
  return httpClient.patch(`${BASE}/${id}/terminar`);
}


export async function registerLaboratoryJobLoss(id, _employeeName, reason) {
  return httpClient.patch(`${BASE}/${id}/merma`, { motivo: reason });
}


export async function addLaboratoryJobDetail(id, _employeeName, text) {
  return httpClient.post(`${BASE}/${id}/detalles`, { texto: text });
}