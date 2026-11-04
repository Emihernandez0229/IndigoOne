import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import {
  listUsers, createPersonal, updatePersonal, deactivateUser, activateUser,
  updateMyProfile, updateMyEmergencyContact, changeMyPassword,
} from "../services/userService";


export default function useUsers() {
  const { data: users, ...rest } = useCrudResource({
    list: listUsers,
    mutations: {
      create: { fn: createPersonal, apply: prepend },
      update: { fn: updatePersonal, apply: mergeById },
      deactivate: { fn: deactivateUser, apply: mergeById },
      activate: { fn: activateUser, apply: mergeById },
      updateMyProfile: { fn: updateMyProfile, apply: mergeById },
      updateMyEmergencyContact: { fn: updateMyEmergencyContact, apply: mergeById },
      changeMyPassword: { fn: changeMyPassword, apply: (prev) => prev },
    },
  });

  return { users, ...rest };
}
