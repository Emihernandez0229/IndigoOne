import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Plus } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import KpiRow from "../../shared/components/KpiRow";
import Button from "../../shared/components/Button";
import SearchInput from "../../shared/components/SearchInput";
import FilterBar from "../../shared/filters/FilterBar";
import SelectFilter from "../../shared/filters/SelectFilter";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import EmptyState from "../../shared/components/EmptyState";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import Can from "../../shared/security/Can";
import usePermissions from "../../shared/hooks/usePermissions";
import useBranchScope from "../../shared/hooks/useBranchScope";
import { ROLES } from "../../shared/security/roles";

import { listBranches } from "../branches/services/branchService";
import usePatients from "../pacientes/hooks/usePatients";
import useVentas from "./hooks/useVentas";
import { filterVentas } from "./filterVentas";
import { SALE_STATUSES } from "./constants";
import VentaTable from "./components/VentaTable";


export default function VentasPage() {

  const navigate = useNavigate();
  const { can } = usePermissions();
  const canManage = can("optica.sales.manage");

  const { isOwner, branches, selectedBranch, setSelectedBranch, loadingBranches } = useBranchScope({
    listBranches,
    ownerRoles: [ROLES.OPTICA_DUENO],
  });

  const { patients } = usePatients(selectedBranch);
  const { ventas, loading, error, cancel } = useVentas(selectedBranch);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [ventaToCancel, setVentaToCancel] = useState(null);


  const patientsById = useMemo(() => {
    const map = new Map();
    patients.forEach((patient) => map.set(patient.id, patient.name));
    return map;
  }, [patients]);

  const ventasWithPatient = useMemo(
    () => ventas.map((venta) => ({ ...venta, patientName: patientsById.get(venta.patientId) })),
    [ventas, patientsById]
  );

  const filtered = useMemo(
    () => filterVentas(ventasWithPatient, { query, status, date }),
    [ventasWithPatient, query, status, date]
  );

  const kpis = useMemo(() => {
    const activeSales = ventas.filter((v) => v.status === "completada");
    const today = new Date().toISOString().slice(0, 10);
    const salesToday = activeSales.filter((v) => (v.createdAt ?? "").slice(0, 10) === today);

    return [
      {
        id: "total", type: "sales", title: "Total",
        value: String(ventas.length), description: "Ventas registradas",
      },
      {
        id: "revenue", type: "revenue", title: "Ingresos",
        value: `$${activeSales.reduce((sum, v) => sum + v.total, 0).toLocaleString("es-MX")}`,
        description: "Ventas completadas",
      },
      {
        id: "today", type: "appointments", title: "Ventas de hoy",
        value: String(salesToday.length), description: "Registradas hoy",
      },
      {
        id: "canceled", type: "canceled", title: "Canceladas",
        value: String(ventas.filter((v) => v.status === "cancelada").length),
        description: "Ventas anuladas",
      },
    ];
  }, [ventas]);


  if (loadingBranches) return <LoadingSpinner />;

  return (

    <PageContainer
      title="Ventas"
      description="Ventas registradas en tu alcance."
      actions={
        <Can permission="optica.sales.create">
          <Button
            className="inline-flex items-center gap-2 py-2.5 text-sm"
            onClick={() => navigate("/opticas/ventas/nueva")}
          >
            <Plus className="h-4 w-4" />
            Nueva venta
          </Button>
        </Can>
      }
    >

      <div className="space-y-6">

        <KpiRow items={kpis} />

        <FilterBar>
          <SearchInput
            className="w-full sm:max-w-xs"
            value={query}
            onChange={setQuery}
            placeholder="Buscar por paciente o producto"
          />
          <SelectFilter
            label="Estado"
            value={status}
            onChange={setStatus}
            placeholder="Todos los estados"
            options={SALE_STATUSES}
          />
          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light"
            />
          </div>
          {isOwner && (
            <SelectFilter
              label="Sucursal"
              value={selectedBranch}
              onChange={setSelectedBranch}
              placeholder="Selecciona una sucursal"
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
          )}
        </FilterBar>

        {!selectedBranch ? (
          <EmptyState
            title="Selecciona una sucursal"
            description="Elige una sucursal para ver sus ventas."
          />
        ) : loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState />
        ) : (
          <VentaTable
            ventas={filtered}
            canCancel={canManage}
            onView={(venta) => navigate(`/opticas/ventas/${venta.id}`)}
            onCancel={(venta) => setVentaToCancel(venta)}
          />
        )}

      </div>

      <ConfirmDialog
        open={Boolean(ventaToCancel)}
        title="Cancelar venta"
        description={
          ventaToCancel &&
          `¿Seguro que quieres cancelar esta venta por ${ventaToCancel.total ? `$${ventaToCancel.total.toLocaleString("es-MX")}` : ""}? Se repondrá el stock de los productos vendidos.`
        }
        confirmLabel="Cancelar venta"
        variant="danger"
        onConfirm={() => cancel(ventaToCancel.id)}
        onClose={() => setVentaToCancel(null)}
      />

    </PageContainer>

  );

}
