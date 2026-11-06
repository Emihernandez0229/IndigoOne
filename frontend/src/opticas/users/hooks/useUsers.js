import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import {
  listUsers, createGerente, createEmpleado, updatePersonal, deactivateUser, activateUser,
  updateMyProfile,
} from "../services/userService";


export default function useUsers() {
  const { data: users, ...rest } = useCrudResource({
    list: listUsers,
    mutations: {
      createGerente: { fn: createGerente, apply: prepend },
      createEmpleado: { fn: createEmpleado, apply: prepend },
      update: { fn: updatePersonal, apply: mergeById },
      deactivate: { fn: deactivateUser, apply: mergeById },
      activate: { fn: activateUser, apply: mergeById },
      updateMyProfile: { fn: updateMyProfile, apply: mergeById },
    },
  });

  return { users, ...rest };
}
