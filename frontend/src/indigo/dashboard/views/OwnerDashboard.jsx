import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info, ChevronDown } from "lucide-react";

import PageContainer from "../../../shared/layouts/PageContainer";
import KpiRow from "../../../shared/components/KpiRow";
import DashboardGrid from "../../../shared/dashboard/DashboardGrid";
import ChartContainer from "../../../shared/charts/ChartContainer";
import DonutChart from "../../../shared/charts/DonutChart";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import ErrorState from "../../../shared/components/ErrorState";

import useBranches from "../../branches/hooks/useBranches";
import useClients from "../../clients/hooks/useClients";
import useLaboratoryJobs from "../../laboratory/hooks/useLaboratoryJobs";
import useInventory from "../../inventory/hooks/useInventory";
import BranchJobsStackedBar from "../components/BranchJobsStackedBar";
import BranchEffectivenessPanel from "../components/BranchEffectivenessPanel";
import { getPeriodRange, inRange, pct } from "../../reports/utils";
import { CHART_COLORS } from "../../../shared/charts/chartTheme";


const PERIODS = [
  { value: "day", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
];

const PERIOD_TEXT = {
  day: "hoy",
  week: "esta semana",
  month: "este mes",
};


export default function OwnerDashboard() {

  const navigate = useNavigate();
  const { branches, loading: loadingBranches, error: errorBranches } = useBranches();
  const { clients, loading: loadingClients, error: errorClients } = useClients();
  const { jobs, loading: loadingJobs, error: errorJobs } = useLaboratoryJobs();
  const { items, loading: loadingItems, error: errorItems } = useInventory();

  const [period, setPeriod] = useState("day");

  const loading = loadingBranches || loadingClients || loadingJobs || loadingItems;
  const error = errorBranches || errorClients || errorJobs || errorItems;

  // Pendientes/en proceso son una foto de "ahora mismo"; terminados y
  // mermas si respetan el periodo (Hoy/Semana/Mes) elegido arriba. Esta
  // base alimenta la barra por sucursal, la dona, el KPI de laboratorio y
  // la tabla/grafica de % de efectividad: todo cambia junto con el periodo.
  const branchStats = useMemo(() => {
    const range = getPeriodRange(period);

    return branches.map((b) => {
      const branchJobs = jobs.filter((j) => j.branchId === b.id);
      const pending = branchJobs.filter((j) => j.status === "pending").length;
      const processing = branchJobs.filter((j) => j.status === "processing").length;
      const completed = branchJobs.filter((j) => (j.status === "completed" || j.status === "warranty") && j.completedAt && inRange(j.completedAt, range)).length;
      const merma = branchJobs.filter((j) => j.status === "loss" && j.lossAt && inRange(j.lossAt, range)).length;

      return { id: b.id, name: b.name, pending, processing, completed, merma, total: pending + processing + completed + merma };
    });
  }, [branches, jobs, period]);

  const periodTotals = useMemo(
    () => branchStats.reduce(
      (acc, b) => ({
        pending: acc.pending + b.pending,
        processing: acc.processing + b.processing,
        completed: acc.completed + b.completed,
        merma: acc.merma + b.merma,
        total: acc.total + b.total,
      }),
      { pending: 0, processing: 0, completed: 0, merma: 0, total: 0 }
    ),
    [branchStats]
  );

  const kpis = useMemo(() => {
    const activeBranches = branches.filter((b) => b.status === "active").length;
    const activeClients = clients.filter((c) => c.status === "active").length;
    const activeItems = items.filter((i) => i.active);
    const totalPieces = activeItems.reduce((sum, i) => sum + Number(i.stockAvailable ?? 0), 0);
    const totalValue = activeItems.reduce((sum, i) => sum + Number(i.stockAvailable ?? 0) * Number(i.cost ?? 0), 0);

    return [
      {
        id: "branches", type: "branches", title: "Sucursales", color: "blue",
        value: String(branches.length), description: `Activas: ${activeBranches}  ·  Inactivas: ${branches.length - activeBranches}`,
      },
      {
        id: "clients", type: "customers", title: "Clientes", color: "purple",
        value: String(clients.length), description: `Activos: ${activeClients}  ·  Inactivos: ${clients.length - activeClients}`,
      },
      {
        id: "inventory", type: "products", title: "Productos e inventario", color: "green",
        value: totalPieces.toLocaleString("es-MX"), description: `Valor total: $${totalValue.toLocaleString("es-MX")}`,
      },
      {
        id: "jobs", type: "orders", title: "Trabajos en laboratorio", color: "orange",
        value: String(periodTotals.total), description: `Pendientes: ${periodTotals.pending}  ·  Proceso: ${periodTotals.processing}`,
      },
    ];
  }, [branches, clients, items, periodTotals]);

  const statusDonut = useMemo(() => {
    const total = periodTotals.total;

    return [
      { label: "Pendientes", value: periodTotals.pending, percent: pct(periodTotals.pending, total), color: CHART_COLORS.warning },
      { label: "En proceso", value: periodTotals.processing, percent: pct(periodTotals.processing, total), color: CHART_COLORS.secondary },
      { label: "Terminados", value: periodTotals.completed, percent: pct(periodTotals.completed, total), color: CHART_COLORS.success },
      { label: "Mermas", value: periodTotals.merma, percent: pct(periodTotals.merma, total), color: CHART_COLORS.error },
    ];
  }, [periodTotals]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  return (

    <PageContainer title="Dashboard Dueño" description="Resumen general del negocio.">

      <div className="space-y-6">

        <div className="flex justify-end">
          <div className="inline-flex rounded-xl border border-gray-200 bg-surface p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  period === p.value ? "bg-indigo-primary text-white" : "text-text-secondary hover:bg-background"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <KpiRow items={kpis} />

        <DashboardGrid>

          <div className="col-span-12 xl:col-span-7">
            <ChartContainer
              title="Estado de trabajos por sucursal"
              subtitle={`Pendientes y en proceso: ahora. Terminados y mermas: ${PERIOD_TEXT[period]}.`}
              align="start"
            >
              <BranchJobsStackedBar data={branchStats} />
            </ChartContainer>
          </div>

          <div className="col-span-12 xl:col-span-5">
            <ChartContainer
              title={
                <span className="inline-flex items-center gap-1.5">
                  Trabajos por estado
                  <Info className="h-3.5 w-3.5 text-text-secondary" />
                </span>
              }
              action={
                <button
                  type="button"
                  onClick={() => navigate("/indigo/laboratorio")}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-text-secondary transition hover:bg-background"
                >
                  Ver detalles
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              }
              align="start"
            >
              <DonutChart data={statusDonut} centerLabel="trabajos totales" />
            </ChartContainer>
          </div>

          <div className="col-span-12">
            <BranchEffectivenessPanel branchStats={branchStats} period={period} />
          </div>

        </DashboardGrid>

      </div>

    </PageContainer>

  );

}
