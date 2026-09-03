import { Routes, Route } from "react-router-dom";

import PublicRoutes from "./publicRoutes";
import PrivateRoutes from "./privateRoutes";

import RoleRedirect from "../shared/navigation/RoleRedirect";


export default function AppRoutes() {

  return (

    <Routes>

      {PublicRoutes()}

      {PrivateRoutes()}

      {/* "/" y cualquier ruta desconocida: RoleRedirect decide a donde ir */}
      <Route path="/" element={<RoleRedirect />} />
      <Route path="*" element={<RoleRedirect />} />

    </Routes>

  );

}
