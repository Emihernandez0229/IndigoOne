import { useEffect, useState } from "react";

import PageContainer from "../../shared/layouts/PageContainer";
import KpiRow from "../../shared/components/KpiRow";
import FilterBar from "../../shared/filters/FilterBar";
import SelectFilter from "../../shared/filters/SelectFilter";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useAuth } from "../../shared/context/AuthContext";
import { ROLES } from "../../shared/security/roles";

import { getResumenReporte } from "./services/reportesService";
import OwnerReportesPage from "./OwnerReportesPage";
import BranchReportesPage from "./BranchReportesPage";
import { currency } from "../../shared/utils/format";


const PERIODS = [
  { value: "day", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Año" },
];

// Mismo valor que acepta GET /api/opticas/reportes/resumen en `periodo`
// ("week" ahí ya significa "últimos 7 días", igual que aquí).
const PERIOD_TO_BACKEND = { day: "day", week: "week", month: "month", year: "year" };


export default function ReportesPage() {

  const { user: currentUser } = useAuth();

  if (currentUser?.role === ROLES.OPTICA_DUENO) {
    return <OwnerReportesPage />;
  }

  if (currentUser?.role === ROLES.OPTICA_ENCARGADO) {
    return <BranchReportesPage />;
  }

  return <ReportesList />;

}


/**
 * Vista de Reportes para Ventas (empleado) - el único rol que llega aquí
 * (Dueño/Encargado se van a Owner/BranchReportesPage arriba). El back solo
 * le da el resumen de sus propias ventas (citas/clientes/inventario le
 * llegan en null desde GET /resumen, ver reportes.service.js), así que no
 * hay nada que mostrar fuera de esa sección.
 */
function ReportesList() {

  const { user: currentUser } = useAuth();
  const hasBranch = Boolean(currentUser?.sucursalId);
  const [period, setPeriod] = useState("month");
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(hasBranch);

  useEffect(() => {
    if (!hasBranch) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getResumenReporte({ branchId: currentUser.sucursalId, periodo: PERIOD_TO_BACKEND[period] });
        if (active) setResumen(data);
      } catch {
        if (active) setResumen(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [hasBranch, currentUser?.sucursalId, period]);

  const salesKpis = [
    { id: "total", type: "sales", title: "Ventas totales", value: currency(resumen?.ventas.total ?? 0), description: "En el período" },
    { id: "count", type: "orders", title: "Transacciones", value: String(resumen?.ventas.operaciones ?? 0), description: "Completadas" },
    { id: "avg", type: "revenue", title: "Ticket promedio", value: currency(resumen?.ventas.ticketPromedio ?? 0), description: "Por venta" },
  ];

  return (

    <PageContainer title="Reportes" description="Resumen de tus ventas.">

      <div className="space-y-8">

        <FilterBar>
          <SelectFilter label="Período" value={period} onChange={setPeriod} options={PERIODS} />
        </FilterBar>

        {!hasBranch ? (
          <p className="text-sm text-text-secondary">No tienes una sucursal asignada.</p>
        ) : loading ? (
          <LoadingSpinner />
        ) : (
          <section>
            <h2 className="mb-3 font-semibold text-text-primary">Ventas</h2>
            <KpiRow items={salesKpis} />
          </section>
        )}

      </div>

    </PageContainer>

  );

}
