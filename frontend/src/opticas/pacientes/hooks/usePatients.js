import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import {
  listPatients,
  createPatient,
  updatePatient,
  deactivatePatient,
  activatePatient,
} from "../services/patientService";


export default function usePatients(branchId) {
  const { data: patients, ...rest } = useCrudResource({
    list: () => listPatients(branchId),
    enabled: Boolean(branchId),
    deps: [branchId],
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
