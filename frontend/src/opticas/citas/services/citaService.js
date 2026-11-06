import { httpClient } from "../../../shared/api/httpClient";


function mapCita(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    branchId: raw.sucursal_id ?? raw.branchId ?? null,
    patientId: raw.cliente_final_id ?? raw.patientId ?? null,
    dateTime: raw.fecha_hora ?? raw.dateTime ?? null,
    reason: raw.motivo ?? raw.reason ?? "",
    status: raw.estado ?? raw.status ?? "programada",
    createdBy: raw.creado_por ?? raw.createdBy ?? null,
    createdAt: raw.created_at ?? raw.createdAt ?? null,
  };
}


// "Todas las sucursales" se pide con todas=true (igual que Reportes) en vez
// de mandar sucursalId vacío - el back (una vez que soporte este parámetro)
// así sabe que es "trae todo", no "sucursalId inválido".
export async function listCitas(branchId) {
  const query = branchId ? `?sucursalId=${branchId}` : "?todas=true";
  const data = await httpClient.get(`/api/opticas/citas${query}`);
  return (data ?? []).map(mapCita);
}


export async function getCita(id) {
  const data = await httpClient.get(`/api/opticas/citas/${id}`);
  return mapCita(data);
}


export async function createCita(payload) {
  const data = await httpClient.post("/api/opticas/citas", {
    sucursalId: payload.branchId || undefined,
    clienteId: payload.patientId,
    fechaHora: payload.dateTime,
    motivo: payload.reason,
  });
  return mapCita(data);
}


export async function updateCita(id, payload) {
  const data = await httpClient.patch(`/api/opticas/citas/${id}`, {
    fechaHora: payload.dateTime,
    motivo: payload.reason,
  });
  return mapCita(data);
}


export async function updateCitaStatus(id, status) {
  const data = await httpClient.patch(`/api/opticas/citas/${id}/estado`, {
    estado: status,
  });
  return mapCita(data);
}
