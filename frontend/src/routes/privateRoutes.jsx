import { Route } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../shared/layouts/AppLayout";

import IndigoRoutes from "./indigoRoutes";
import OpticasRoutes from "./opticasRoutes";


/**
 * Arbol de rutas privadas:
 *   ProtectedRoute (exige sesion)
 *     -> AppLayout (sidebar + navbar)
 *          -> rutas de cada modulo
 */
export default function PrivateRoutes() {

  return (

    <Route element={<ProtectedRoute />}>

      <Route element={<AppLayout />}>

        {IndigoRoutes()}

        {OpticasRoutes()}

      </Route>

    </Route>

  );

}
