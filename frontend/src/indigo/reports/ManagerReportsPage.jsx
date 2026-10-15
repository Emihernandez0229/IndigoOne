import { useMemo, useState } from "react";

import PageContainer from "../../shared/layouts/PageContainer";
import KpiRow from "../../shared/components/KpiRow";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import DashboardGrid from "../../shared/dashboard/DashboardGrid";
import ChartContainer from "../../shared/charts/ChartContainer";
import DonutChart from "../../shared/charts/DonutChart";
import { useAuth } from "../../shared/context/AuthContext";

import useLaboratoryJobs from "../laboratory/hooks/useLaboratoryJobs";
import useBranches from "../branches/hooks/useBranches";
import { SERVICE_TYPE_LABELS } from "../laboratory/constants";
import PeriodSelector from "./components/PeriodSelector";
import StackedJobsBarChart from "./components/StackedJobsBarChart";
import BranchMetricComparisonList from "./components/BranchMetricComparisonList";
import JobsEffectivenessTrendChart from "./components/JobsEffectivenessTrendChart";
import PeriodComparisonChart from "./components/PeriodComparisonChart";
import PeriodDetailTable from "./components/PeriodDetailTable";
import ReportsActivityPanel from "./components/ReportsActivityPanel";
import { CHART_COLORS } from "../../shared/charts/chartTheme";
import {
  categoryOf,
  getPeriodRange,
  inRange,
  pct,
  formatShortDate,
  buildPeriodWindows,
} from "./utils";


const WORK_TYPE_COLOR = "#8B7FE0";
const WORK_TYPE_WORST_COLOR = "#F06595";


function bucketStats(jobs, from, to, name) {
  const bucketJobs = jobs.filter((j) => {
    const d = new Date(j.entryAt);
    return d >= from && d <= to;
  });

  const registrados = bucketJobs.length;
  const terminados = bucketJobs.filter((j) => categoryOf(j) === "completed").length;
  const pendientes = bucketJobs.filter((j) => categoryOf(j) === "pending").length;
  const proceso = bucketJobs.filter((j) => categoryOf(j) === "processing").length;
  const merma = bucketJobs.filter((j) => categoryOf(j) === "merma").length;
  const resolved = terminados + merma;

  return {
    name,
    registrados,
    terminados,
    completed: terminados,
    pending: pendientes,
    processing: proceso,
    merma,
    efectividad: resolved > 0 ? Math.round((terminados / resolved) * 1000) / 10 : 100,
  };
}


// La granularidad de "Trabajos en el tiempo" y "Trabajos" sigue al boton de
// arriba: Semanal -> ultimos 7 dias (por dia), Mensual -> ultimas 4 semanas
// (por semana), Anual -> los meses del año en curso (por mes). Un rango
// personalizado cae de vuelta a buckets semanales entre esas fechas. Las
// ventanas de fecha son compartidas (ver reports/utils.js); las estadisticas
// por ventana siguen siendo propias de Reportes.
function buildPeriodBuckets(jobs, periodMode, range) {
  return buildPeriodWindows(periodMode, range).map(({ label, from, to }) => bucketStats(jobs, from, to, label));
}


export default function ManagerReportsPage() {

  const { user: currentUser } = useAuth();
  const { jobs, loading: loadingJobs, error: errorJobs } = useLaboratoryJobs();
  const { branches, loading: loadingBranches, error: errorBranches } = useBranches();

  const [periodMode, setPeriodMode] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const myBranch = useMemo(
    () => branches.find((b) => b.id === currentUser?.sucursalId),
    [branches, currentUser?.sucursalId]
  );

  const range = useMemo(
    () => getPeriodRange(periodMode, customFrom, customTo),
    [periodMode, customFrom, customTo]
  );

  const branchJobs = useMemo(
    () => jobs.filter((j) => j.branchId === myBranch?.id),
    [jobs, myBranch]
  );

  const scopedJobs = useMemo(
    () => branchJobs.filter((j) => inRange(j.entryAt, range)),
    [branchJobs, range]
  );

  const kpis = useMemo(() => {
    const total = scopedJobs.length;
    const completed = scopedJobs.filter((j) => categoryOf(j) === "completed").length;
    const processing = scopedJobs.filter((j) => categoryOf(j) === "processing").length;
    const pending = scopedJobs.filter((j) => categoryOf(j) === "pending").length;
    const merma = scopedJobs.filter((j) => categoryOf(j) === "merma").length;
    const resolved = completed + merma;
    const effectiveness = resolved > 0 ? Math.round((completed / resolved) * 1000) / 10 : 100;

    return [
      { id: "registered", type: "orders", title: "Trabajos registrados", color: "blue", value: String(total), description: "En el periodo seleccionado" },
      { id: "completed", type: "confirmed", title: "Trabajos terminados", color: "green", value: String(completed), description: `${pct(completed, total)}% del total` },
      { id: "pending", type: "pendingClock", title: "Pendientes y en proceso", color: "orange", value: String(pending + processing), description: `${pending} pendientes · ${processing} en proceso` },
      { id: "merma", type: "lowStock", title: "Mermas", color: "red", value: String(merma), description: `${pct(merma, total)}% del total` },
      { id: "effectiveness", type: "rate", title: "% de efectividad", color: "purple", value: `${effectiveness}%`, description: "Terminados vs. mermas" },
      { id: "mermaRate", type: "rate", title: "% de mermas", color: "red", value: `${pct(merma, total)}%`, description: "Sobre el total de trabajos" },
    ];
  }, [scopedJobs]);

  const periodBuckets = useMemo(() => buildPeriodBuckets(branchJobs, periodMode, range), [branchJobs, periodMode, range]);

  const statusDonut = useMemo(() => {
    const total = scopedJobs.length;
    const completed = scopedJobs.filter((j) => categoryOf(j) === "completed").length;
    const processing = scopedJobs.filter((j) => categoryOf(j) === "processing").length;
    const pending = scopedJobs.filter((j) => categoryOf(j) === "pending").length;
    const merma = scopedJobs.filter((j) => categoryOf(j) === "merma").length;

    return [
      { label: "Terminados", value: completed, percent: pct(completed, total), color: CHART_COLORS.success },
      { label: "Mermas", value: merma, percent: pct(merma, total), color: CHART_COLORS.error },
      { label: "En proceso", value: processing, percent: pct(processing, total), color: CHART_COLORS.secondary },
      { label: "Pendientes", value: pending, percent: pct(pending, total), color: CHART_COLORS.warning },
    ];
  }, [scopedJobs]);

  // Efectividad y merma por tipo de trabajo (tipo de servicio: bisel,
  // montaje, tinte, otro).
  const byWorkType = useMemo(() => {
    const byType = {};
    scopedJobs.forEach((j) => {
      const type = j.serviceType || "otro";
      if (!byType[type]) byType[type] = { completed: 0, merma: 0 };
      if (categoryOf(j) === "completed") byType[type].completed += 1;
      if (categoryOf(j) === "merma") byType[type].merma += 1;
    });

    const entries = Object.entries(byType).map(([type, v], index) => {
      const resolved = v.completed + v.merma;
      return {
        id: `${type}-${index}`,
        name: SERVICE_TYPE_LABELS[type] ?? type,
        effectiveness: resolved > 0 ? Math.round((v.completed / resolved) * 1000) / 10 : 100,
        merma: v.merma,
        pctMerma: resolved > 0 ? Math.round((v.merma / resolved) * 1000) / 10 : 0,
      };
    });

    const worstMermaId = entries.reduce((worst, e) => (!worst || e.pctMerma > worst.pctMerma ? e : worst), null)?.id;

    return {
      effectiveness: [...entries].sort((a, b) => b.effectiveness - a.effectiveness),
      merma: [...entries].sort((a, b) => b.pctMerma - a.pctMerma),
      worstMermaId,
    };
  }, [scopedJobs]);

  const topClients = useMemo(() => {
    const counts = {};
    scopedJobs.forEach((j) => {
      const name = j.clientName;
      if (!name) return;
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value], index) => ({ id: `${name}-${index}`, name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [scopedJobs]);

  const salesActivity = useMemo(() => {
    const counts = {};
    scopedJobs.forEach((j) => {
      const name = j.registeredBy || j.seller;
      if (!name) return;
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [scopedJobs]);

  const salesDetail = useMemo(() => {
    const byName = {};
    scopedJobs.forEach((j) => {
      const name = j.registeredBy || j.seller;
      if (!name) return;
      if (!byName[name]) byName[name] = [];
      byName[name].push(j);
    });
    return Object.entries(byName)
      .map(([name, list], index) => ({
        id: `${name}-${index}`,
        name,
        jobs: [...list].sort((a, b) => new Date(b.entryAt) - new Date(a.entryAt)),
      }))
      .sort((a, b) => b.jobs.length - a.jobs.length);
  }, [scopedJobs]);

  const labActivity = useMemo(() => {
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
  }, [scopedJobs]);

  const labDetail = useMemo(() => {
    const byPerson = {};
    scopedJobs.forEach((j) => {
      const name = j.labPerson;
      if (!name) return;
      if (!byPerson[name]) byPerson[name] = { name, completedJobs: [], mermaJobs: [] };
      if (categoryOf(j) === "completed") byPerson[name].completedJobs.push(j);
      if (categoryOf(j) === "merma") byPerson[name].mermaJobs.push(j);
    });
    return Object.entries(byPerson)
      .map(([name, v], index) => ({ id: `${name}-${index}`, name, ...v }))
      .sort((a, b) => (b.completedJobs.length + b.mermaJobs.length) - (a.completedJobs.length + a.mermaJobs.length));
  }, [scopedJobs]);

  const updatedAt = new Date().toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });

  if (loadingJobs || loadingBranches) return <LoadingSpinner />;
  if (errorJobs || errorBranches) return <ErrorState />;

  return (

    <PageContainer
      title="Reportes"
      description={myBranch?.name ? `Gráficas y estadísticas de ${myBranch.name}.` : "Gráficas y estadísticas de tu sucursal."}
    >

      <div className="space-y-6">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <PeriodSelector
            mode={periodMode}
            onModeChange={setPeriodMode}
            rangeLabel={`${formatShortDate(range.from)} – ${formatShortDate(range.to)}`}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
          />
          <p className="text-sm text-text-secondary">Actualizado hoy, {updatedAt}</p>
        </div>

        <KpiRow items={kpis} columns={6} />

        <DashboardGrid>

          <div className="col-span-12 xl:col-span-7">
            <ChartContainer title="Trabajos en el tiempo" subtitle="Registrados, terminados y % de efectividad.">
              <JobsEffectivenessTrendChart data={periodBuckets} />
            </ChartContainer>
          </div>

          <div className="col-span-12 xl:col-span-5">
            <ChartContainer title="Distribución por estado" subtitle={`De ${scopedJobs.length} trabajos registrados.`}>
              <DonutChart data={statusDonut} centerLabel="Total de trabajos" />
            </ChartContainer>
          </div>

          <div className="col-span-12 xl:col-span-4">
            <ChartContainer title="Efectividad por tipo de trabajo">
              <BranchMetricComparisonList
                branches={byWorkType.effectiveness}
                valueKey="effectiveness"
                showPercent={false}
                valueSuffix="%"
                color={WORK_TYPE_COLOR}
              />
            </ChartContainer>
          </div>

          <div className="col-span-12 xl:col-span-4">
            <ChartContainer title="Merma por tipo de trabajo">
              <BranchMetricComparisonList
                branches={byWorkType.merma}
                valueKey="pctMerma"
                showPercent={false}
                valueSuffix="%"
                color={WORK_TYPE_COLOR}
                colorForItem={(w) => (w.id === byWorkType.worstMermaId && w.pctMerma > 0 ? WORK_TYPE_WORST_COLOR : WORK_TYPE_COLOR)}
              />
            </ChartContainer>
          </div>

          <div className="col-span-12 xl:col-span-4">
            <ChartContainer title="Top 5 clientes" subtitle="Por número de trabajos.">
              <BranchMetricComparisonList
                branches={topClients}
                valueKey="value"
                showPercent={false}
                color={WORK_TYPE_COLOR}
              />
            </ChartContainer>
          </div>

          <div className="col-span-12">
            <ChartContainer title="Trabajos" subtitle="Terminada, en proceso, pendiente y mermas; solo de esta sucursal.">
              <StackedJobsBarChart data={periodBuckets} />
            </ChartContainer>
          </div>

          <div className="col-span-12">
            <ChartContainer title="Comparativa con periodo anterior">
              <PeriodComparisonChart jobs={branchJobs} />
            </ChartContainer>
          </div>

          <div className="col-span-12">
            <ReportsActivityPanel
              salesSummary={salesActivity}
              salesDetail={salesDetail}
              labSummary={labActivity}
              labDetail={labDetail}
            />
          </div>

          <div className="col-span-12">
            <ChartContainer title="Detalles" subtitle="Solo de esta sucursal.">
              <PeriodDetailTable jobs={branchJobs} />
            </ChartContainer>
          </div>

        </DashboardGrid>

      </div>

    </PageContainer>

  );

}
