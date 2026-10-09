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
import TrendLineChart from "./components/TrendLineChart";
import BranchMetricComparisonList from "./components/BranchMetricComparisonList";
import BranchComparisonTable from "./components/BranchComparisonTable";
import {
  categoryOf,
  getPeriodRange,
  previousRange,
  inRange,
  pct,
  formatShortDate,
  computeBranchStats,
  computeTrendBuckets,
} from "./utils";


export default function ReportsPage() {

  const { jobs, loading: loadingJobs, error: errorJobs } = useLaboratoryJobs();
  const { branches, loading: loadingBranches, error: errorBranches } = useBranches();

  const [periodMode, setPeriodMode] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [branchId, setBranchId] = useState("");

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

  const trendBuckets = useMemo(() => {
    const trendJobs = branchId ? jobs.filter((j) => j.branchId === branchId) : jobs;
    return computeTrendBuckets(trendJobs, periodMode, range);
  }, [jobs, branchId, periodMode, range]);

  const mermaRanking = useMemo(
    () => [...branchStats].sort((a, b) => b.merma - a.merma),
    [branchStats]
  );

  const completedRanking = useMemo(
    () => [...branchStats].sort((a, b) => b.completed - a.completed),
    [branchStats]
  );

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

          <div className="col-span-12 xl:col-span-7">
            <ChartContainer title="Trabajos por sucursal" subtitle="Terminada, en proceso, pendiente y mermas.">
              <StackedJobsBarChart data={branchStats} />
            </ChartContainer>
          </div>

          <div className="col-span-12 xl:col-span-5">
            <ChartContainer title="Distribución por estado" subtitle="Proporción sobre el total de trabajos.">
              <DonutChart data={statusDonut} centerLabel="Total de trabajos" />
            </ChartContainer>
          </div>

          <div className="col-span-12">
            <ChartContainer title="Tendencia de trabajos" subtitle="Registrados vs. terminados; se ajusta al periodo elegido arriba.">
              <TrendLineChart data={trendBuckets} />
            </ChartContainer>
          </div>

          <div className="col-span-12 xl:col-span-6">
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

          <div className="col-span-12 xl:col-span-6">
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

          <div className="col-span-12">
            <ChartContainer title="Comparativo entre sucursales" subtitle={`Periodo: ${formatShortDate(range.from)} – ${formatShortDate(range.to)}`}>
              <BranchComparisonTable branches={branchStats} />
            </ChartContainer>
          </div>

        </DashboardGrid>

      </div>

    </PageContainer>
  );
}
