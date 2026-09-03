import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getHomePathForRole } from "../security/roleConfig";

import LoadingSpinner from "../components/LoadingSpinner";

export default function RoleRedirect() {

  const { user, initializing } = useAuth();


  if (initializing) {
    return <LoadingSpinner />;
  }


  if (!user) {
    return <Navigate to="/login" replace />;
  }


  return <Navigate to={getHomePathForRole(user.role)} replace />;

}
