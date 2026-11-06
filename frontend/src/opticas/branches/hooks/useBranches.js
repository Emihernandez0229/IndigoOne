import { useCrudResource, append, mergeById } from "../../../shared/hooks/useCrudResource";
import {
  listBranches, createBranch, updateBranch, updateBranchContact, deactivateBranch, activateBranch,
  assignManager, changeManager,
} from "../services/branchService";


// assignManager/changeManager no traen la sucursal actualizada en su
// respuesta (solo la fila de sucursal_gerentes) - lo único que cambia en
// la lista de sucursales es quién la gerencia, y eso se resuelve cruzando
// con Personal (ver withManagerInfo), no con esta respuesta. Por eso su
// `apply` no toca `branches`: solo falta recargar Personal, que ya es
// responsabilidad de quien llama (useUsers reacciona solo cuando se usa su
// propio `update`/`create`, no hace falta nada más aquí).
const noOp = (prev) => prev;

export default function useBranches() {
  const { data: branches, ...rest } = useCrudResource({
    list: listBranches,
    mutations: {
      create: { fn: createBranch, apply: append },
      update: { fn: updateBranch, apply: mergeById },
      updateContact: { fn: updateBranchContact, apply: mergeById },
      deactivate: { fn: deactivateBranch, apply: mergeById },
      activate: { fn: activateBranch, apply: mergeById },
      assignManager: { fn: assignManager, apply: noOp },
      changeManager: { fn: changeManager, apply: noOp },
    },
  });

  return { branches, ...rest };
}
