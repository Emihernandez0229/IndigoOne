import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import {
  listLaboratoryJobs, createLaboratoryJob,
  acceptLaboratoryJob, completeLaboratoryJob, registerLaboratoryJobLoss, addLaboratoryJobDetail,
} from "../services/laboratoryService";


export default function useLaboratoryJobs() {
  const { data: jobs, ...rest } = useCrudResource({
    list: listLaboratoryJobs,
    mutations: {
      create: { fn: createLaboratoryJob, apply: prepend },
      accept: { fn: acceptLaboratoryJob, apply: mergeById },
      complete: { fn: completeLaboratoryJob, apply: mergeById },
      registerLoss: { fn: registerLaboratoryJobLoss, apply: mergeById },
      addDetail: { fn: addLaboratoryJobDetail, apply: mergeById },
    },
  });

  return { jobs, ...rest };
}
