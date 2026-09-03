import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../shared/context/AuthContext";
import { hasPermission } from "../shared/security/accessControl";
import { getHomePathForRole } from "../shared/security/roleConfig";

import LoadingSpinner from "../shared/components/LoadingSpinner";


/**
 * Puerta de acceso a las rutas privadas.
 *
 *   <Route element={<ProtectedRoute />}>                  -> solo login
 *   <Route element={<ProtectedRoute roles={["INDIGO_OWNER"]} />}>
 *   <Route element={<ProtectedRoute permission="reports.global" />}>
 */
export default function ProtectedRoute({ roles, permission }) {

  const { user, initializing } = useAuth();

  if (initializing) {
    return <LoadingSpinner />;
  }


  // Sin sesion -> login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }


  const home = getHomePathForRole(user.role);


  // Restriccion por rol.
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={home} replace />;
  }


  // Restriccion por permiso.
  if (permission && !hasPermission(user.permissions ?? [], permission)) {
    return <Navigate to={home} replace />;
  }


  return <Outlet />;

}
