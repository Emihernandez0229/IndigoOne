import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import { listUsers, createUser, updateUser, deactivateUser, activateUser } from "../services/userService";


export default function useUsers() {
  const { data: users, ...rest } = useCrudResource({
    list: listUsers,
    mutations: {
      create: { fn: createUser, apply: prepend },
      update: { fn: updateUser, apply: mergeById },
      deactivate: { fn: deactivateUser, apply: mergeById },
      activate: { fn: activateUser, apply: mergeById },
    },
  });

  return { users, ...rest };
}
