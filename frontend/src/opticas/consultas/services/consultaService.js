import { httpClient } from "../../../shared/api/httpClient";


function mapOjo(prefix, raw) {
  return {
    esfera: raw[`${prefix}_esfera`] ?? "",
    cilindro: raw[`${prefix}_cilindro`] ?? "",
    eje: raw[`${prefix}_eje`] ?? "",
    adicion: raw[`${prefix}_adicion`] ?? "",
  };
}


function mapConsulta(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    branchId: raw.sucursal_id ?? null,
    patientId: raw.cliente_final_id ?? null,
    patientName: raw.cliente_nombre ?? null,
    examDate: raw.fecha_examen ?? null,
    od: mapOjo("od", raw),
    oi: mapOjo("oi", raw),
    dip: raw.dip ?? "",
    notes: raw.observaciones ?? "",
    registeredBy: raw.registrado_por ?? null,
    createdAt: raw.created_at ?? null,
  };
}


// Vacio/undefined no se manda (el back valida formato en los que si vienen,
// y todos los campos de graduacion son opcionales - ver consultas.schema.js).
function numOrUndefined(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}


function ojoToPayload(ojo = {}) {
  return {
    esfera: numOrUndefined(ojo.esfera),
    cilindro: numOrUndefined(ojo.cilindro),
    eje: numOrUndefined(ojo.eje),
    adicion: numOrUndefined(ojo.adicion),
  };
}


/**
 * "Consultas" (examen de la vista) - para los 3 roles. El Dueño debe
 * indicar sucursalId (la del paciente); Jefe de sucursal/Ventas usan la
 * suya automaticamente, pero no estorba mandarla igual.
 */
export async function listConsultas({ branchId, patientId, desde, hasta, limit, offset } = {}) {
  const params = new URLSearchParams();
  if (branchId) params.set("sucursalId", branchId);
  if (patientId) params.set("clienteId", patientId);
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  if (limit) params.set("limit", limit);
  if (offset) params.set("offset", offset);

  const consultas = await httpClient.get(`/api/opticas/consultas?${params.toString()}`);
  return (consultas ?? []).map(mapConsulta);
}


export async function getConsulta(id) {
  const consulta = await httpClient.get(`/api/opticas/consultas/${id}`);
  return mapConsulta(consulta);
}


export async function createConsulta(payload) {
  const creada = await httpClient.post("/api/opticas/consultas", {
    sucursalId: payload.branchId || undefined,
    clienteId: payload.patientId,
    fechaExamen: payload.examDate,
    od: ojoToPayload(payload.od),
    oi: ojoToPayload(payload.oi),
    dip: numOrUndefined(payload.dip),
    observaciones: payload.notes?.trim() || undefined,
  });
  return mapConsulta(creada);
}
