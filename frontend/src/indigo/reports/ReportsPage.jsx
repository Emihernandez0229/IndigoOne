import { useMemo, useState } from "react";

import PageContainer from "../../shared/layouts/PageContainer";
import KpiRow from "../../shared/components/KpiRow";
import SelectFilter from "../../shared/filters/SelectFilter";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import DashboardGrid from "../../shared/dashboard/DashboardGrid";
import ChartContainer from "../../shared/charts/ChartContainer";
import DonutChart from "../../shared/charts/DonutChart";

import useLaboratoryJobs from "../laboratory/hooks/useLaboratoryJobs";
import useBranches from "../branches/hooks/useBranches";
import PeriodSelector from "./components/PeriodSelector";
import StackedJobsBarChart from "./components/StackedJobsBarChart";
import BranchMetricComparisonList from "./components/BranchMetricComparisonList";
import BranchComparisonTable from "./components/BranchComparisonTable";
import MermasByTypeList from "./components/MermasByTypeList";
import LabPerformanceList from "./components/LabPerformanceList";
import SalesPerformanceChart from "../dashboard/components/SalesPerformanceChart";
import { CHART_COLORS } from "../../shared/charts/chartTheme";
import {
  categoryOf,
  getPeriodRange,
  previousRange,
  inRange,
  pct,
  formatShortDate,
  computeBranchStats,
} from "./utils";


const BRANCH_CHART_PERIODS = [
  { value: "week", label: "Semana" },
  { value: "month", label: "Mensual" },
  { value: "year", label: "Anual" },
];

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];


// Trabajos registrados por dia (semana), por semana (mes) o por mes (año) -
// ventana propia (no respeta el PeriodSelector de arriba), igual patron que
// "Rendimiento de ventas" / "Flujo de producción" en los dashboards de rol.
function buildBranchJobBuckets(jobs, mode) {
  const now = new Date();

  if (mode === "week") {
    const buckets = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const from = new Date(day); from.setHours(0, 0, 0, 0);
      const to = new Date(day); to.setHours(23, 59, 59, 999);
      const count = jobs.filter((j) => { const d = new Date(j.entryAt); return d >= from && d <= to; }).length;
      buckets.push({ label: i === 0 ? "Hoy" : WEEKDAY_LABELS[day.getDay()], count });
    }
    return buckets;
  }

  if (mode === "month") {
    const buckets = [];
    for (let i = 3; i >= 0; i--) {
      const to = new Date(now); to.setDate(now.getDate() - i * 7);
      const from = new Date(to); from.setDate(to.getDate() - 6); from.setHours(0, 0, 0, 0);
      const count = jobs.filter((j) => { const d = new Date(j.entryAt); return d >= from && d <= to; }).length;
      buckets.push({ label: i === 0 ? "Esta semana" : `Hace ${i} sem.`, count });
    }
    return buckets;
  }

  const buckets = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const from = new Date(d.getFullYear(), d.getMonth(), 1);
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const count = jobs.filter((j) => { const e = new Date(j.entryAt); return e >= from && e <= to; }).length;
    buckets.push({ label: MONTH_LABELS[d.getMonth()], count });
  }
  return buckets;
}


export default function ReportsPage() {

  const { jobs, loading: loadingJobs, error: errorJobs } = useLaboratoryJobs();
  const { branches, loading: loadingBranches, error: errorBranches } = useBranches();

  const [periodMode, setPeriodMode] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [branchId, setBranchId] = useState("");
  const [branchChartPeriod, setBranchChartPeriod] = useState("week");

  const branchOptions = useMemo(
    () => branches.map((b) => ({ value: b.id, label: b.name })),
    [branches]
  );

  const range = useMemo(
    () => getPeriodRange(periodMode, customFrom, customTo),
    [periodMode, customFrom, customTo]
  );

  const scopedJobs = useMemo(() => {
    let result = jobs.filter((j) => inRange(j.entryAt, range));
    if (branchId) result = result.filter((j) => j.branchId === branchId);
    return result;
  }, [jobs, range, branchId]);

  const branchStats = useMemo(() => {
    const scopeBranches = branchId ? branches.filter((b) => b.id === branchId) : branches;
    return computeBranchStats(scopedJobs, scopeBranches);
  }, [scopedJobs, branches, branchId]);

  const kpis = useMemo(() => {
    const total = scopedJobs.length;
    const completed = scopedJobs.filter((j) => categoryOf(j) === "completed").length;
    const processing = scopedJobs.filter((j) => categoryOf(j) === "processing").length;
    const pending = scopedJobs.filter((j) => categoryOf(j) === "pending").length;
    const merma = scopedJobs.filter((j) => categoryOf(j) === "merma").length;

    const prevRange = previousRange(range);
    const prevJobs = prevRange.from
      ? jobs.filter((j) => inRange(j.entryAt, prevRange) && (!branchId || j.branchId === branchId))
      : [];
    const prevTotal = prevJobs.length;
    const prevCompleted = prevJobs.filter((j) => categoryOf(j) === "completed").length;

    const deltaTotal = prevTotal ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;
    const deltaCompleted = prevCompleted ? Math.round(((completed - prevCompleted) / prevCompleted) * 100) : null;

    const topBranch = [...branchStats].sort((a, b) => b.total - a.total)[0] ?? null;

    return [
      {
        id: "total", type: "orders", title: "Total de trabajos", color: "blue",
        value: String(total),
        trend: deltaTotal != null ? `${deltaTotal >= 0 ? "+" : ""}${deltaTotal}%` : undefined,
        trendDirection: deltaTotal >= 0 ? "up" : "down",
        description: deltaTotal != null ? "vs periodo anterior" : "En el periodo seleccionado",
      },
      {
        id: "completed", type: "confirmed", title: "Terminados exitosamente", color: "green",
        value: String(completed),
        trend: deltaCompleted != null ? `${deltaCompleted >= 0 ? "+" : ""}${deltaCompleted}%` : undefined,
        trendDirection: deltaCompleted >= 0 ? "up" : "down",
        description: `${pct(completed, total)}% del total`,
      },
      {
        id: "pending", type: "pendingClock", title: "Pendientes y en proceso", color: "orange",
        value: String(pending + processing),
        description: `${pending} pendientes · ${processing} en proceso`,
      },
      {
        id: "merma", type: "lowStock", title: "Mermas", color: "red",
        value: String(merma),
        description: `${pct(merma, total)}% del total`,
      },
      {
        id: "topBranch", type: "cities", title: "Sucursal con más trabajos", color: "purple",
        value: topBranch?.name ?? "—",
        description: topBranch ? `${topBranch.total} trabajos · ${pct(topBranch.total, total)}%` : "Sin datos",
      },
    ];
  }, [scopedJobs, branchStats, range, jobs, branchId]);

  const statusDonut = useMemo(() => {
    const total = scopedJobs.length;
    const completed = scopedJobs.filter((j) => categoryOf(j) === "completed").length;
    const processing = scopedJobs.filter((j) => categoryOf(j) === "processing").length;
    const pending = scopedJobs.filter((j) => categoryOf(j) === "pending").length;
    const merma = scopedJobs.filter((j) => categoryOf(j) === "merma").length;

    return [
      { label: "Terminados", value: completed, percent: pct(completed, total), color: "#22A06B" },
      { label: "En proceso", value: processing, percent: pct(processing, total), color: "#5565C8" },
      { label: "Pendientes", value: pending, percent: pct(pending, total), color: "#F59E0B" },
      { label: "Mermas", value: merma, percent: pct(merma, total), color: "#E5484D" },
    ];
  }, [scopedJobs]);

  const mermaRanking = useMemo(
    () => [...branchStats].sort((a, b) => b.merma - a.merma),
    [branchStats]
  );

  const completedRanking = useMemo(
    () => [...branchStats].sort((a, b) => b.completed - a.completed),
    [branchStats]
  );

  // Mermas por tipo de bisel y por tipo de servicio (urgente/normal), cada
  // grupo se escala contra su propio maximo (no comparten eje).
  const mermaByType = useMemo(() => {
    const mermaJobs = scopedJobs.filter((j) => categoryOf(j) === "merma");
    const byBisel = {};
    const byService = { Normal: 0, Urgente: 0 };

    mermaJobs.forEach((j) => {
      const biselType = j.biselType || "Sin definir";
      byBisel[biselType] = (byBisel[biselType] || 0) + 1;
      if (j.urgent) byService.Urgente += 1; else byService.Normal += 1;
    });

    return {
      bisel: Object.entries(byBisel).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      service: Object.entries(byService).filter(([, value]) => value > 0).map(([name, value]) => ({ name, value })),
    };
  }, [scopedJobs]);

  // En el orden natural de las sucursales (no ordenado por valor), igual
  // que el diseño de referencia.
  const effectivenessRanking = useMemo(
    () =>
      branchStats.map((b) => {
        const resolved = b.completed + b.merma;
        return { ...b, effectiveness: resolved > 0 ? Math.round((b.completed / resolved) * 1000) / 10 : 100 };
      }),
    [branchStats]
  );

  const worstEffectivenessId = useMemo(
    () => effectivenessRanking.reduce((worst, b) => (!worst || b.effectiveness < worst.effectiveness ? b : worst), null)?.id,
    [effectivenessRanking]
  );

  // Lo siguiente solo se usa cuando hay una sucursal seleccionada (vista
  // de una sola sucursal, en vez de la comparativa global entre todas).
  const branchJobs = useMemo(
    () => (branchId ? jobs.filter((j) => j.branchId === branchId) : []),
    [jobs, branchId]
  );

  const branchPeriodBuckets = useMemo(
    () => buildBranchJobBuckets(branchJobs, branchChartPeriod),
    [branchJobs, branchChartPeriod]
  );

  const sellerComparison = useMemo(() => {
    if (!branchId) return [];
    const counts = {};
    scopedJobs.forEach((j) => {
      const name = j.registeredBy || j.seller;
      if (!name) return;
      counts[name] = (counts[name] || 0) + 1;
    });
    const total = scopedJobs.length;
    return Object.entries(counts)
      .map(([name, value], index) => ({ id: `${name}-${index}`, name, value, pctValue: pct(value, total) }))
      .sort((a, b) => b.value - a.value);
  }, [scopedJobs, branchId]);

  const labComparison = useMemo(() => {
    if (!branchId) return [];
    const byPerson = {};
    scopedJobs.forEach((j) => {
      const name = j.labPerson;
      if (!name) return;
      if (!byPerson[name]) byPerson[name] = { name, completed: 0, merma: 0 };
      if (categoryOf(j) === "completed") byPerson[name].completed += 1;
      if (categoryOf(j) === "merma") byPerson[name].merma += 1;
    });
    return Object.values(byPerson)
      .map((p, index) => ({ id: `${p.name}-${index}`, ...p, pctMerma: pct(p.merma, p.completed + p.merma) }))
      .sort((a, b) => (b.completed + b.merma) - (a.completed + a.merma));
  }, [scopedJobs, branchId]);

  // De mayor a menor indice de mermas (los laboratoristas con mas mermas
  // encabezan la lista).
  const labEffectivenessRanking = useMemo(() => {
    return labComparison
      .map((p) => {
        const resolved = p.completed + p.merma;
        return { ...p, effectiveness: resolved > 0 ? Math.round((p.completed / resolved) * 1000) / 10 : 100 };
      })
      .sort((a, b) => b.pctMerma - a.pctMerma);
  }, [labComparison]);

  const worstLabId = labEffectivenessRanking[0]?.id;

  const updatedAt = new Date().toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });

  if (loadingJobs || loadingBranches) return <LoadingSpinner />;
  if (errorJobs || errorBranches) return <ErrorState />;

  return (

    <PageContainer
      title="Reportes"
      description="Gráficas y estadísticas del funcionamiento de las sucursales de Indigo."
    >

      <div className="space-y-6">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <PeriodSelector
              mode={periodMode}
              onModeChange={setPeriodMode}
              rangeLabel={`${formatShortDate(range.from)} – ${formatShortDate(range.to)}`}
              customFrom={customFrom}
              customTo={customTo}
              onCustomFromChange={setCustomFrom}
              onCustomToChange={setCustomTo}
            />
            <SelectFilter
              label=""
              value={branchId}
              onChange={setBranchId}
              placeholder="Todas (vista global)"
              options={branchOptions}
            />
          </div>
          <p className="text-sm text-text-secondary">Actualizado hoy, {updatedAt}</p>
        </div>

        <KpiRow items={kpis} columns={5} />

        <DashboardGrid>

          {branchId ? (
            <>

              <div className="col-span-12">
                <ChartContainer
                  title="Trabajos por periodo"
                  subtitle="Trabajos registrados en la sucursal."
                  action={
                    <div className="inline-flex rounded-xl border border-gray-200 bg-surface p-1">
                      {BRANCH_CHART_PERIODS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setBranchChartPeriod(p.value)}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                            branchChartPeriod === p.value ? "bg-indigo-primary text-white" : "text-text-secondary hover:bg-background"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  }
                >
                  <SalesPerformanceChart
                    data={branchPeriodBuckets}
                    dataKey="count"
                    valueFormatter={(v) => `${v} trabajos`}
                    yTickFormatter={(v) => String(Math.round(v))}
                  />
                </ChartContainer>
              </div>

              <div className="col-span-12 xl:col-span-4">
                <ChartContainer title="Comparación por vendedor" subtitle="Trabajos registrados.">
                  <BranchMetricComparisonList
                    branches={sellerComparison}
                    valueKey="value"
                    pctKey="pctValue"
                    color={CHART_COLORS.secondary}
                  />
                </ChartContainer>
              </div>

              <div className="col-span-12 xl:col-span-4">
                <ChartContainer title="Comparación por laborista" subtitle="Terminados, mermas y % de mermas.">
                  <LabPerformanceList people={labComparison} />
                </ChartContainer>
              </div>

              <div className="col-span-12 xl:col-span-4">
                <ChartContainer title="% de efectividad por laborista" subtitle="Mayor a menor índice de mermas.">
                  <BranchMetricComparisonList
                    branches={labEffectivenessRanking}
                    valueKey="effectiveness"
                    showPercent={false}
                    valueSuffix="%"
                    color="#8B7FE0"
                    colorForItem={(p) => (p.id === worstLabId ? "#F06595" : "#8B7FE0")}
                  />
                </ChartContainer>
              </div>

            </>
          ) : (
            <>

              <div className="col-span-12">
                <ChartContainer title="Trabajos por sucursal" subtitle="Terminada, en proceso, pendiente y mermas.">
                  <StackedJobsBarChart data={branchStats} />
                </ChartContainer>
              </div>

              <div className="col-span-12 xl:col-span-4">
                <ChartContainer title="Comparación de trabajos terminados entre sucursal">
                  <BranchMetricComparisonList
                    branches={completedRanking}
                    valueKey="completed"
                    pctKey="pctCompleted"
                    color="#22A06B"
                    footnote="El porcentaje indica los trabajos terminados sobre el total de trabajos de cada sucursal."
                  />
                </ChartContainer>
              </div>

              <div className="col-span-12 xl:col-span-4">
                <ChartContainer title="Comparación de mermas por sucursal">
                  <BranchMetricComparisonList
                    branches={mermaRanking}
                    valueKey="merma"
                    pctKey="pctMerma"
                    color="#E5484D"
                    footnote="El porcentaje indica las mermas sobre el total de trabajos de cada sucursal."
                  />
                </ChartContainer>
              </div>

              <div className="col-span-12 xl:col-span-4">
                <ChartContainer title="Efectividad por sucursal">
                  <BranchMetricComparisonList
                    branches={effectivenessRanking}
                    valueKey="effectiveness"
                    showPercent={false}
                    valueSuffix="%"
                    color="#8B7FE0"
                    colorForItem={(b) => (b.id === worstEffectivenessId ? "#F06595" : "#8B7FE0")}
                  />
                </ChartContainer>
              </div>

            </>
          )}

          <div className="col-span-12 xl:col-span-6">
            <ChartContainer title="Mermas por tipo">
              <MermasByTypeList bisel={mermaByType.bisel} service={mermaByType.service} color={CHART_COLORS.orange} />
            </ChartContainer>
          </div>

          <div className="col-span-12 xl:col-span-6">
            <ChartContainer title="Distribución por estado" subtitle="Proporción sobre el total de trabajos.">
              <DonutChart data={statusDonut} centerLabel="Total de trabajos" />
            </ChartContainer>
          </div>

          <div className="col-span-12">
            <ChartContainer title="Detalle por sucursal" subtitle={`Periodo: ${formatShortDate(range.from)} – ${formatShortDate(range.to)}`}>
              <BranchComparisonTable branches={branchStats} />
            </ChartContainer>
          </div>

        </DashboardGrid>

      </div>

    </PageContainer>
  );
}
