import { useCrudResource, prepend } from "../../../shared/hooks/useCrudResource";
import { listConsultas, createConsulta } from "../services/consultaService";


// Historial de consultas de un paciente (pestaña "Consultas" en el
// detalle de cliente). `branchId` es la sucursal del paciente - el back
// la exige para el Dueño (ver resolverSucursal en consultas.service.js).
export default function useConsultas({ branchId, patientId }) {
  const { data: consultas, ...rest } = useCrudResource({
    list: () => listConsultas({ branchId, patientId }),
    enabled: Boolean(branchId && patientId),
    deps: [branchId, patientId],
    mutations: {
      create: { fn: createConsulta, apply: prepend },
    },
  });

  return { consultas, ...rest };
}
