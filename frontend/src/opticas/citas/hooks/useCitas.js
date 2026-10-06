import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import {
  listCitas,
  createCita,
  updateCita,
  updateCitaStatus,
} from "../services/citaService";


export default function useCitas(branchId) {
  const { data: citas, ...rest } = useCrudResource({
    list: () => listCitas(branchId),
    enabled: Boolean(branchId),
    deps: [branchId],
    numbered: true,
    mutations: {
      create: { fn: createCita, apply: prepend },
      update: { fn: updateCita, apply: mergeById },
      changeStatus: { fn: updateCitaStatus, apply: mergeById },
    },
  });

  return { citas, ...rest };
}
