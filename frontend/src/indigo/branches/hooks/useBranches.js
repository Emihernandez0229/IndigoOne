import { useCrudResource, append, mergeById } from "../../../shared/hooks/useCrudResource";
import { listBranches, createBranch, updateBranch, updateBranchContact, deactivateBranch, activateBranch } from "../services/branchService";


export default function useBranches() {
  const { data: branches, ...rest } = useCrudResource({
    list: listBranches,
    mutations: {
      create: { fn: createBranch, apply: append },
      update: { fn: updateBranch, apply: mergeById },
      updateContact: { fn: updateBranchContact, apply: mergeById },
      deactivate: { fn: deactivateBranch, apply: mergeById },
      activate: { fn: activateBranch, apply: mergeById },
    },
  });

  return { branches, ...rest };
}
