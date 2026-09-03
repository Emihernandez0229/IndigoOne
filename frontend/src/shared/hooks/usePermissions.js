import { useMemo } from "react";

import { useAuth } from "../context/AuthContext";

import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from "../security/accessControl";

export default function usePermissions() {

  const { user } = useAuth();

  const permissions = user?.permissions;


  return useMemo(() => {

    const list = permissions ?? [];

    return {

      permissions: list,

      can: (permission) =>
        hasPermission(list, permission),

      canAny: (items = []) =>
        hasAnyPermission(list, items),

      canAll: (items = []) =>
        hasAllPermissions(list, items),

    };

  }, [permissions]);

}
