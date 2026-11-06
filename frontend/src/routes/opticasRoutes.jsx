import { Route, Navigate } from "react-router-dom";

import OpticasDashboard from "../opticas/dashboard/OpticasDashboard";
import BranchesPage from "../opticas/branches/BranchesPage";
import UsersPage from "../opticas/users/UsersPage";
import InventoryPage from "../opticas/inventory/InventoryPage";
import InventoryDetailPage from "../opticas/inventory/InventoryDetailPage";
import PacientesPage from "../opticas/pacientes/PacientesPage";
import CitasPage from "../opticas/citas/CitasPage";
import VentasPage from "../opticas/ventas/VentasPage";
import NuevaVentaPage from "../opticas/ventas/NuevaVentaPage";
import NuevaConsultaPage from "../opticas/consultas/NuevaConsultaPage";
import OpticaPage from "../opticas/optica/OpticaPage";
import CatalogoPage from "../opticas/catalogo/CatalogoPage";
import ReportesPage from "../opticas/reportes/ReportesPage";
import ProfilePage from "../opticas/profile/ProfilePage";

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

      <Route path="perfil" element={<ProfilePage />} />

      <Route element={<ProtectedRoute permission="optica.settings.view" />}>
        <Route path="optica" element={<OpticaPage />} />
      </Route>

      <Route element={<ProtectedRoute permission="optica.catalog.view" />}>
        <Route path="productos-servicios" element={<CatalogoPage />} />
      </Route>

      <Route element={<ProtectedRoute permission="optica.branch.view" />}>
        <Route path="sucursales" element={<BranchesPage />} />
      </Route>

      <Route element={<ProtectedRoute permission="optica.user.view" />}>
        <Route path="usuarios" element={<UsersPage />} />
      </Route>

      <Route element={<ProtectedRoute permission="optica.sales.view" />}>
        <Route path="ventas" element={<VentasPage />} />
        <Route path="ventas/nueva" element={<NuevaVentaPage />} />
      </Route>

      <Route element={<ProtectedRoute permission="optica.reports.view" />}>
        <Route path="reportes" element={<ReportesPage />} />
      </Route>

      <Route element={<ProtectedRoute permission="optica.appointment.manage" />}>
        <Route path="citas" element={<CitasPage />} />
      </Route>

      <Route element={<ProtectedRoute permission="optica.patient.view" />}>
        <Route path="pacientes" element={<PacientesPage />} />
      </Route>

      <Route element={<ProtectedRoute permission="optica.consulta.manage" />}>
        <Route path="pacientes/:patientId/consultas/nueva" element={<NuevaConsultaPage />} />
      </Route>

      <Route element={<ProtectedRoute permission="optica.inventory.view" />}>
        <Route path="inventario" element={<InventoryPage />} />
        <Route path="inventario/:id" element={<InventoryDetailPage />} />
      </Route>

    </Route>

  );

}
