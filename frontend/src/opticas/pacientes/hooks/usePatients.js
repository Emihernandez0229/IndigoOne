import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import {
  listPatients,
  listAllPatients,
  createPatient,
  updatePatient,
  deactivatePatient,
  activatePatient,
} from "../services/patientService";


// `scopeToAll` lo usa el Dueño (módulo "Clientes"): trae los pacientes de
// todas las sucursales a la vez, sin depender de `branchId`. El
// Encargado/Empleado siguen viendo solo los de su propia sucursal.
export default function usePatients(branchId, { scopeToAll = false } = {}) {
  const { data: patients, ...rest } = useCrudResource({
    list: () => (scopeToAll ? listAllPatients() : listPatients(branchId)),
    enabled: scopeToAll || Boolean(branchId),
    deps: [branchId, scopeToAll],
    numbered: true,
    mutations: {
      create: { fn: createPatient, apply: prepend },
      update: { fn: updatePatient, apply: mergeById },
      deactivate: { fn: deactivatePatient, apply: mergeById },
      activate: { fn: activatePatient, apply: mergeById },
    },
  });

  return { patients, ...rest };
}
