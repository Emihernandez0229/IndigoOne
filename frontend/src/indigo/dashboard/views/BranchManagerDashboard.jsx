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
import { useAuth } from "../../../shared/context/AuthContext";

import useBranches from "../../branches/hooks/useBranches";
import useClients from "../../clients/hooks/useClients";
import useUsers from "../../users/hooks/useUsers";
import useLaboratoryJobs from "../../laboratory/hooks/useLaboratoryJobs";
import useInventory from "../../inventory/hooks/useInventory";
import SalesPerformanceChart from "../components/SalesPerformanceChart";
import TeamActivityPanel from "../components/TeamActivityPanel";
import BranchMetricComparisonList from "../../reports/components/BranchMetricComparisonList";
import { getPeriodRange, inRange, pct } from "../../reports/utils";
import { CHART_COLORS } from "../../../shared/charts/chartTheme";


const PERIODS = [
  { value: "week", label: "Semana" },
  { value: "month", label: "Mensual" },
  { value: "year", label: "Anual" },
];

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];


function sumAmount(jobs, from, to) {
  return jobs
    .filter((j) => {
      const d = new Date(j.entryAt);
      return d >= from && d <= to;
    })
    .reduce((sum, j) => sum + (j.amount || 0), 0);
}


// Ultimos 7 dias (el ultimo = "Hoy"), ultimas 4 semanas, o los 12 meses del
// año en curso - cada punto suma el monto de los trabajos registrados.
function buildSalesBuckets(jobs, period) {
  const now = new Date();

  if (period === "week") {
    const buckets = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const from = new Date(day); from.setHours(0, 0, 0, 0);
      const to = new Date(day); to.setHours(23, 59, 59, 999);
      buckets.push({ label: i === 0 ? "Hoy" : WEEKDAY_LABELS[day.getDay()], amount: sumAmount(jobs, from, to) });
    }
    return buckets;
  }

  if (period === "month") {
    const buckets = [];
    for (let i = 3; i >= 0; i--) {
      const to = new Date(now); to.setDate(now.getDate() - i * 7);
      const from = new Date(to); from.setDate(to.getDate() - 6); from.setHours(0, 0, 0, 0);
      buckets.push({ label: i === 0 ? "Esta semana" : `Hace ${i} sem.`, amount: sumAmount(jobs, from, to) });
    }
    return buckets;
  }

  const buckets = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const from = new Date(d.getFullYear(), d.getMonth(), 1);
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    buckets.push({ label: MONTH_LABELS[d.getMonth()], amount: sumAmount(jobs, from, to) });
  }
  return buckets;
}


export default function BranchManagerDashboard() {

  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { branches, loading: loadingBranches, error: errorBranches } = useBranches();
  const { clients, loading: loadingClients, error: errorClients } = useClients();
  const { users, loading: loadingUsers, error: errorUsers } = useUsers();
  const { jobs, loading: loadingJobs, error: errorJobs } = useLaboratoryJobs();
  const { items, loading: loadingItems, error: errorItems } = useInventory();

  const [period, setPeriod] = useState("week");

  const loading = loadingBranches || loadingClients || loadingUsers || loadingJobs || loadingItems;
  const error = errorBranches || errorClients || errorUsers || errorJobs || errorItems;

  const myBranch = useMemo(
    () => branches.find((b) => b.id === currentUser?.sucursalId),
    [branches, currentUser?.sucursalId]
  );

  const range = useMemo(() => getPeriodRange(period), [period]);

  const branchJobs = useMemo(
    () => jobs.filter((j) => j.branchId === myBranch?.id),
    [jobs, myBranch]
  );

  const branchClients = useMemo(
    () => clients.filter((c) => (c.branches ?? []).some((b) => b.indigoBranchId === myBranch?.id)),
    [clients, myBranch]
  );

  const branchStaff = useMemo(
    () => users.filter((u) => u.branchId === myBranch?.id),
    [users, myBranch]
  );

  const branchItems = useMemo(
    () => items.filter((i) => i.branchId === myBranch?.id && i.active),
    [items, myBranch]
  );

  // Pendientes/en proceso: foto de "ahora mismo". Terminados y mermas
  // respetan el periodo (Semana/Mensual/Anual) elegido arriba - alimenta la
  // dona, el KPI de % de efectividad y la tabla de actividad del equipo.
  const periodStats = useMemo(() => {
    const pending = branchJobs.filter((j) => j.status === "pending").length;
    const processing = branchJobs.filter((j) => j.status === "processing").length;
    const completed = branchJobs.filter((j) => (j.status === "completed" || j.status === "warranty") && j.completedAt && inRange(j.completedAt, range)).length;
    const merma = branchJobs.filter((j) => j.status === "loss" && j.lossAt && inRange(j.lossAt, range)).length;
    return { pending, processing, completed, merma, total: pending + processing + completed + merma };
  }, [branchJobs, range]);

  const kpis = useMemo(() => {
    const activeClients = branchClients.filter((c) => c.status === "active").length;
    const activeStaff = branchStaff.filter((u) => u.status === "active").length;
    const totalPieces = branchItems.reduce((sum, i) => sum + Number(i.stockAvailable ?? 0), 0);
    const totalValue = branchItems.reduce((sum, i) => sum + Number(i.stockAvailable ?? 0) * Number(i.cost ?? 0), 0);
    const resolved = periodStats.completed + periodStats.merma;
    const effectiveness = resolved > 0 ? Math.round((periodStats.completed / resolved) * 100) : 100;

    return [
      {
        id: "clients", type: "customers", title: "Clientes", color: "purple",
        value: String(branchClients.length), description: `Activos: ${activeClients}  ·  Inactivos: ${branchClients.length - activeClients}`,
      },
      {
        id: "staff", type: "team", title: "Personal", color: "blue",
        value: String(branchStaff.length), description: `Activos: ${activeStaff}  ·  Inactivos: ${branchStaff.length - activeStaff}`,
      },
      {
        id: "inventory", type: "products", title: "Productos e inventario", color: "green",
        value: totalPieces.toLocaleString("es-MX"), description: `Valor total: $${totalValue.toLocaleString("es-MX")}`,
      },
      {
        id: "effectiveness", type: "rate", title: "% de efectividad", color: "orange",
        value: `${effectiveness}%`, description: "Terminados vs. mermas",
      },
    ];
  }, [branchClients, branchStaff, branchItems, periodStats]);

  const salesData = useMemo(() => buildSalesBuckets(branchJobs, period), [branchJobs, period]);

  const statusDonut = useMemo(() => {
    const total = periodStats.total;
    return [
      { label: "Pendientes", value: periodStats.pending, percent: pct(periodStats.pending, total), color: CHART_COLORS.warning },
      { label: "En proceso", value: periodStats.processing, percent: pct(periodStats.processing, total), color: CHART_COLORS.secondary },
      { label: "Terminados", value: periodStats.completed, percent: pct(periodStats.completed, total), color: CHART_COLORS.success },
      { label: "Mermas", value: periodStats.merma, percent: pct(periodStats.merma, total), color: CHART_COLORS.error },
    ];
  }, [periodStats]);

  const labMermaStats = useMemo(() => {
    const mermaJobs = branchJobs.filter((j) => j.status === "loss" && j.lossAt && inRange(j.lossAt, range));
    const byPerson = {};
    mermaJobs.forEach((j) => {
      const name = j.labPerson || "Sin asignar";
      byPerson[name] = (byPerson[name] || 0) + 1;
    });
    const total = mermaJobs.length;
    return Object.entries(byPerson)
      .map(([name, count], index) => ({ id: `${name}-${index}`, name, merma: count, pctMerma: pct(count, total) }))
      .sort((a, b) => b.merma - a.merma);
  }, [branchJobs, range]);

  const salesActivity = useMemo(() => {
    const inPeriod = branchJobs.filter((j) => inRange(j.entryAt, range));
    const counts = {};
    inPeriod.forEach((j) => {
      const name = j.registeredBy || j.seller;
      if (!name) return;
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [branchJobs, range]);

  const labActivity = useMemo(() => {
    const byPerson = {};
    branchJobs.forEach((j) => {
      const name = j.labPerson;
      if (!name) return;
      if (!byPerson[name]) byPerson[name] = { name, completed: 0, merma: 0 };
      if ((j.status === "completed" || j.status === "warranty") && j.completedAt && inRange(j.completedAt, range)) byPerson[name].completed += 1;
      if (j.status === "loss" && j.lossAt && inRange(j.lossAt, range)) byPerson[name].merma += 1;
    });
    return Object.values(byPerson)
      .map((p) => ({ ...p, pctMerma: pct(p.merma, p.completed + p.merma) }))
      .sort((a, b) => (b.completed + b.merma) - (a.completed + a.merma));
  }, [branchJobs, range]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  return (

    <PageContainer title="Dashboard Sucursal" description={myBranch?.name ?? "Resumen de tu sucursal."}>

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
            <ChartContainer title="Rendimiento de ventas en mi sucursal" subtitle="Por periodo." align="start">
              <SalesPerformanceChart data={salesData} />
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

          <div className="col-span-12 self-start xl:col-span-7">
            <ChartContainer
              title="Comparación de mermas por laboratorista"
              subtitle="Por periodo."
              action={
                <button
                  type="button"
                  onClick={() => navigate("/indigo/mermas")}
                  className="text-sm font-medium text-indigo-primary hover:underline"
                >
                  Ver mermas →
                </button>
              }
            >
              <BranchMetricComparisonList
                branches={labMermaStats}
                valueKey="merma"
                pctKey="pctMerma"
                color={CHART_COLORS.error}
              />
            </ChartContainer>
          </div>

          <div className="col-span-12 self-start xl:col-span-5">
            <TeamActivityPanel sales={salesActivity} lab={labActivity} />
          </div>

        </DashboardGrid>

      </div>

    </PageContainer>

  );

}
