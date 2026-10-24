import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import {
  listUsers, createUser, updateUser, deactivateUser, activateUser,
  createEmployee, updateEmployee,
  updateMyProfile, updateMyEmergencyContact, changeMyPassword,
  createPersonal, updatePersonal, deactivatePersonal, activatePersonal, resetPersonalPassword,
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
      updateMyProfile: { fn: updateMyProfile, apply: mergeById },
      updateMyEmergencyContact: { fn: updateMyEmergencyContact, apply: mergeById },
      changeMyPassword: { fn: changeMyPassword, apply: (prev) => prev },
      createPersonal: { fn: createPersonal, apply: prepend },
      updatePersonal: { fn: updatePersonal, apply: mergeById },
      deactivatePersonal: { fn: deactivatePersonal, apply: mergeById },
      activatePersonal: { fn: activatePersonal, apply: mergeById },
      resetPersonalPassword: { fn: resetPersonalPassword, apply: (prev) => prev },
    },
  });

  return { users, ...rest };
}
