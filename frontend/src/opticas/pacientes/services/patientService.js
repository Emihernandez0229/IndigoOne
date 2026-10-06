import { httpClient } from "../../../shared/api/httpClient";


function mapPatient(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    branchId: raw.sucursal_id ?? raw.branchId ?? null,
    branchName: raw.sucursal_nombre ?? raw.branchName ?? null,
    name: raw.nombre ?? raw.name ?? "",
    phone: raw.telefono ?? raw.phone ?? "",
    email: raw.email ?? "",
    birthDate: raw.fecha_nacimiento ?? raw.birthDate ?? null,
    createdAt: raw.created_at ?? raw.createdAt ?? null,
    updatedAt: raw.updated_at ?? raw.updatedAt ?? null,
    active: raw.active ?? raw.activo ?? true,
  };
}


export async function listPatients(branchId) {
  const { pacientes } = await httpClient.get(
    `/api/opticas/pacientes/sucursal/${branchId}`
  );
  return (pacientes ?? []).map(mapPatient);
}


export async function getPatient(id) {
  const { paciente } = await httpClient.get(`/api/opticas/pacientes/${id}`);
  return mapPatient(paciente);
}


export async function createPatient(payload) {
  const { paciente } = await httpClient.post("/api/opticas/pacientes", {
    sucursalId: payload.branchId || undefined,
    nombre: payload.name,
    telefono: payload.phone || null,
    email: payload.email || null,
    fechaNacimiento: payload.birthDate || null,
  });
  return mapPatient(paciente);
}


export async function updatePatient(id, payload) {
  const { paciente } = await httpClient.patch(`/api/opticas/pacientes/${id}`, {
    nombre: payload.name,
    telefono: payload.phone || null,
    email: payload.email || null,
    fechaNacimiento: payload.birthDate || null,
  });
  return mapPatient(paciente);
}


// NOTA: el backend real todavia no expone estos dos endpoints.
// Ver aviso para el equipo de back al final de la respuesta.
export async function deactivatePatient(id) {
  const { paciente } = await httpClient.patch(
    `/api/opticas/pacientes/${id}/deactivate`
  );
  return mapPatient(paciente);
}


export async function activatePatient(id) {
  const { paciente } = await httpClient.patch(
    `/api/opticas/pacientes/${id}/activate`
  );
  return mapPatient(paciente);
}
