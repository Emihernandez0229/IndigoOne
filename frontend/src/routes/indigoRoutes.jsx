import { Route, Navigate } from "react-router-dom";

import IndigoDashboard from "../indigo/dashboard/IndigoDashboard";
import BranchesPage from "../indigo/branches/BranchesPage";
import MyBranchPage from "../indigo/branches/MyBranchPage";
import UsersRouter from "../indigo/users/UsersRouter";
import ClientsRouter from "../indigo/clients/ClientsRouter";
import ClientFormPage from "../indigo/clients/manager/ClientFormPage";
import LaboratoryPage from "../indigo/laboratory/LaboratoryPage";
import MermasPage from "../indigo/mermas/MermasPage";
import ReportsPage from "../indigo/reports/ReportsPage";
import InventoryPage from "../indigo/inventory/InventoryPage";
import InventoryDetailPage from "../indigo/inventory/InventoryDetailPage";
import TrabajosRouter from "../indigo/sales/TrabajosRouter";
import NewJobPage from "../indigo/sales/NewJobPage";

import ProtectedRoute from "./ProtectedRoute";


/**
 * Rutas del modulo INDIGO.
 */
export default function IndigoRoutes() {

  return (

    <Route path="/indigo">

      <Route index element={<Navigate to="dashboard" replace />} />

      <Route path="dashboard" element={<IndigoDashboard />} />

      <Route element={<ProtectedRoute permission="branch.view" />}>
        <Route path="sucursales" element={<BranchesPage />} />
        <Route path="mi-sucursal" element={<MyBranchPage />} />
      </Route>

      <Route element={<ProtectedRoute permission="user.view" />}>
        <Route path="usuarios" element={<UsersRouter />} />
      </Route>

      <Route element={<ProtectedRoute permission="client.view" />}>
        <Route path="clientes" element={<ClientsRouter />} />
        <Route path="clientes/nuevo" element={<ClientFormPage />} />
        <Route path="clientes/:id/editar" element={<ClientFormPage />} />
      </Route>

      <Route element={<ProtectedRoute permission="reports.branch" />}>
        <Route path="reportes" element={<ReportsPage />} />
      </Route>

      <Route element={<ProtectedRoute permission="laboratory.job.view" />}>
        <Route path="laboratorio" element={<LaboratoryPage />} />
        <Route path="mermas" element={<MermasPage />} />
        <Route path="trabajos" element={<TrabajosRouter />} />
      </Route>

      <Route element={<ProtectedRoute permission="laboratory.job.create" />}>
        <Route path="trabajos/nuevo" element={<NewJobPage />} />
      </Route>

      <Route element={<ProtectedRoute permission="inventory.view" />}>
        <Route path="inventario" element={<InventoryPage />} />
        <Route path="inventario/:id" element={<InventoryDetailPage />} />
      </Route>

    </Route>

  );

}
