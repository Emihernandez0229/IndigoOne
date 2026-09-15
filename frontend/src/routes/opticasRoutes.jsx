import { Route, Navigate } from "react-router-dom";

import OpticasDashboard from "../opticas/dashboard/OpticasDashboard";
import BranchesPage from "../opticas/branches/BranchesPage";
import UsersPage from "../opticas/users/UsersPage";
import ComingSoon from "../shared/pages/ComingSoon";

import ProtectedRoute from "./ProtectedRoute";


/**
 * Rutas del modulo OPTICAS.
 * Se montan dentro de <ProtectedRoute> + <AppLayout> (ver privateRoutes).
 */
export default function OpticasRoutes() {

  return (

    <Route path="/opticas">

      <Route index element={<Navigate to="dashboard" replace />} />

      <Route path="dashboard" element={<OpticasDashboard />} />

      <Route element={<ProtectedRoute permission="optica.branch.view" />}>
        <Route path="sucursales" element={<BranchesPage />} />
      </Route>

      <Route element={<ProtectedRoute permission="optica.user.view" />}>
        <Route path="usuarios" element={<UsersPage />} />
      </Route>

      <Route element={<ProtectedRoute permission="optica.sales.view" />}>
        <Route path="ventas" element={<ComingSoon title="Punto de venta" />} />
        <Route path="laboratorio" element={<ComingSoon title="Laboratorio" />} />
      </Route>

      <Route element={<ProtectedRoute permission="optica.appointment.manage" />}>
        <Route path="citas" element={<ComingSoon title="Citas" />} />
      </Route>

      <Route element={<ProtectedRoute permission="optica.patient.view" />}>
        <Route path="pacientes" element={<ComingSoon title="Pacientes" />} />
      </Route>

    </Route>

  );

}
