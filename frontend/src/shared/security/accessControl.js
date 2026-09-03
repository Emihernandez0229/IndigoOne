import { PERMISSIONS } from "./permissions";

export function getPermissionsForRole(role) {

  return PERMISSIONS[role] ?? [];

}

export function hasPermission(userPermissions = [], permission) {

  if (!permission) {
    return true;
  }

  return userPermissions.includes(permission);

}


export function hasAnyPermission(userPermissions = [], permissions = []) {

  if (permissions.length === 0) {
    return true;
  }

  return permissions.some(

    (permission) => hasPermission(userPermissions, permission)

  );

}



export function hasAllPermissions(userPermissions = [], permissions = []) {

  if (permissions.length === 0) {
    return true;
  }

  return permissions.every(

    (permission) => hasPermission(userPermissions, permission)

  );

}
