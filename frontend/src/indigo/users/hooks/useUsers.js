import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import {
  listUsers, createUser, updateUser, deactivateUser, activateUser,
  createEmployee, updateEmployee,
} from "../services/userService";


export default function useUsers() {
  const { data: users, ...rest } = useCrudResource({
    list: listUsers,
    mutations: {
      create: { fn: createUser, apply: prepend },
      update: { fn: updateUser, apply: mergeById },
      createEmployee: { fn: createEmployee, apply: prepend },
      updateEmployee: { fn: updateEmployee, apply: mergeById },
      deactivate: { fn: deactivateUser, apply: mergeById },
      activate: { fn: activateUser, apply: mergeById },
    },
  });

  return { users, ...rest };
}
