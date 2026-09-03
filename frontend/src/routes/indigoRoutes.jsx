import { Route, Navigate } from "react-router-dom";

import IndigoDashboard from "../indigo/dashboard/IndigoDashboard";
import BranchesPage from "../indigo/branches/BranchesPage";
import UsersPage from "../indigo/users/UsersPage";
import ComingSoon from "../shared/pages/ComingSoon";

import ProtectedRoute from "./ProtectedRoute";


/**
 * Rutas del modulo INDIGO.
 * Se montan dentro de <ProtectedRoute> + <AppLayout> (ver privateRoutes).
 * Cada bloque protegido exige el permiso correspondiente.
 */
export default function IndigoRoutes() {

  return (

    <Route path="/indigo">

      <Route index element={<Navigate to="dashboard" replace />} />

      <Route path="dashboard" element={<IndigoDashboard />} />

      <Route element={<ProtectedRoute permission="branch.view" />}>
        <Route path="sucursales" element={<BranchesPage />} />
      </Route>

      <Route element={<ProtectedRoute permission="user.view" />}>
        <Route path="usuarios" element={<UsersPage />} />
      </Route>

      <Route element={<ProtectedRoute permission="reports.branch" />}>
        <Route path="reportes" element={<ComingSoon title="Reportes" />} />
      </Route>

      <Route element={<ProtectedRoute permission="sales.view" />}>
        <Route path="ventas" element={<ComingSoon title="Ventas" />} />
      </Route>

      <Route element={<ProtectedRoute permission="laboratory.job.view" />}>
        <Route path="laboratorio" element={<ComingSoon title="Laboratorio" />} />
      </Route>

    </Route>

  );

}
