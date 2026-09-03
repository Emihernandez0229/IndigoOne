import { Route, Navigate } from "react-router-dom";

import OpticaDashboard from "../opticas/dashboard/OpticaDashboard";
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

      <Route path="dashboard" element={<OpticaDashboard />} />

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
