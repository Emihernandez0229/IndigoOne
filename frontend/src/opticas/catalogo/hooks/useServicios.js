import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import {
  listServicios,
  createServicio,
  updateServicio,
  deactivateServicio,
  activateServicio,
} from "../services/catalogoService";


export default function useServicios() {
  const { data: servicios, ...rest } = useCrudResource({
    list: listServicios,
    mutations: {
      create: { fn: createServicio, apply: prepend },
      update: { fn: updateServicio, apply: mergeById },
      deactivate: { fn: deactivateServicio, apply: mergeById },
      activate: { fn: activateServicio, apply: mergeById },
    },
  });

  return { servicios, ...rest };
}
