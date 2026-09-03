import usePermissions from "../hooks/usePermissions";

export default function Can({
  permission,
  any = [],
  all = [],
  fallback = null,
  children,
}) {

  const { can, canAny, canAll } = usePermissions();


  const allowed =
    can(permission) &&
    canAny(any) &&
    canAll(all);


  if (!allowed) {
    return fallback;
  }


  return children;

}
