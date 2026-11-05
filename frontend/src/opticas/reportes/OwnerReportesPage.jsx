import { useMemo, useState } from "react";

import { Home } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";

import useBranches from "../branches/hooks/useBranches";
import useVentas from "../ventas/hooks/useVentas";
import useProductos from "../catalogo/hooks/useProductos";
import useServicios from "../catalogo/hooks/useServicios";
import usePatients from "../pacientes/hooks/usePatients";
import useCitas from "../citas/hooks/useCitas";
import useUsers from "../users/hooks/useUsers";
import useMovimientos from "../inventory/hooks/useMovimientos";

import VentasReportTab from "./tabs/VentasReportTab";
import InventarioReportTab from "./tabs/InventarioReportTab";
import ClientesReportTab from "./tabs/ClientesReportTab";
import ServiciosReportTab from "./tabs/ServiciosReportTab";
import CitasReportTab from "./tabs/CitasReportTab";
import { quickRangeDates } from "./salesReportUtils";


const TOP_TABS = [
  { value: "ventas", label: "Ventas" },
  { value: "inventario", label: "Inventario" },
  { value: "pacientes", label: "Clientes y pacientes" },
  { value: "servicios", label: "Servicios" },
  { value: "citas", label: "Citas" },
];


export default function OwnerReportesPage() {

  const { branches, loading: loadingBranches, error: errorBranches } = useBranches();
  // "" = todas las sucursales - el dueño necesita ver todo para comparar.
  const { ventas, loading: loadingVentas, error: errorVentas } = useVentas("");
  const { productos, loading: loadingProductos } = useProductos();
  const { servicios, loading: loadingServicios } = useServicios();
  const { patients, loading: loadingPatients } = usePatients("", { scopeToAll: true });
  const { citas, loading: loadingCitas } = useCitas("");
  const { users, loading: loadingUsers } = useUsers();
  const { movimientos, loading: loadingMovimientos } = useMovimientos();

  const [tab, setTab] = useState("ventas");
  const [quickRange, setQuickRange] = useState("30d");
  const [dateFrom, setDateFrom] = useState(() => quickRangeDates(30).from);
  const [dateTo, setDateTo] = useState(() => quickRangeDates(30).to);
  const [branchId, setBranchId] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const branchesById = useMemo(() => new Map(branches.map((b) => [b.id, b.name])), [branches]);

  const scopeLabel = branchId ? branchesById.get(branchId) ?? "Sucursal" : "Todas las sucursales";

  const handleQuickRange = (value, days) => {
    setQuickRange(value);
    const { from, to } = quickRangeDates(days);
    setDateFrom(from);
    setDateTo(to);
  };

  const handleDateFromChange = (value) => {
    setDateFrom(value);
    setQuickRange("");
  };

  const handleDateToChange = (value) => {
    setDateTo(value);
    setQuickRange("");
  };

  const handleClearFilters = () => {
    handleQuickRange("30d", 30);
    setBranchId("");
    setResetKey((k) => k + 1);
  };

  const loading = loadingBranches || loadingVentas || loadingProductos || loadingServicios ||
    loadingPatients || loadingCitas || loadingUsers || loadingMovimientos;
  const error = errorBranches || errorVentas;

  const sharedProps = {
    branches, branchesById, branchId, setBranchId,
    dateFrom, dateTo, quickRange,
    onQuickRange: handleQuickRange,
    onDateFromChange: handleDateFromChange,
    onDateToChange: handleDateToChange,
    onClearFilters: handleClearFilters,
  };


  return (

    <PageContainer
      title="Reportes"
      description="Consulta y analiza la información histórica de la óptica por período."
      actions={
        <span className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-surface px-4 py-2 text-sm font-medium text-text-primary">
          <Home className="h-4 w-4" />
          {scopeLabel}
        </span>
      }
    >

      <div className="space-y-6">

        <div className="flex flex-wrap gap-6 border-b border-gray-200">
          {TOP_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`border-b-2 px-1 pb-3 text-sm font-medium transition ${
                tab === t.value ? "border-indigo-primary text-indigo-primary" : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState />
        ) : (
          <>
            {tab === "ventas" && (
              <VentasReportTab key={resetKey} ventas={ventas} productos={productos} servicios={servicios} {...sharedProps} />
            )}
            {tab === "inventario" && (
              <InventarioReportTab key={resetKey} productos={productos} movimientos={movimientos} users={users} {...sharedProps} />
            )}
            {tab === "pacientes" && (
              <ClientesReportTab key={resetKey} patients={patients} ventas={ventas} citas={citas} {...sharedProps} />
            )}
            {tab === "servicios" && (
              <ServiciosReportTab key={resetKey} ventas={ventas} servicios={servicios} {...sharedProps} />
            )}
            {tab === "citas" && (
              <CitasReportTab key={resetKey} citas={citas} patients={patients} users={users} {...sharedProps} />
            )}
          </>
        )}

      </div>

    </PageContainer>

  );

}
