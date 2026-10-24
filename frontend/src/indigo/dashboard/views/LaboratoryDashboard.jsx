import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";

import PageContainer from "../../../shared/layouts/PageContainer";
import KpiRow from "../../../shared/components/KpiRow";
import Button from "../../../shared/components/Button";
import DashboardGrid from "../../../shared/dashboard/DashboardGrid";
import ChartContainer from "../../../shared/charts/ChartContainer";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import ErrorState from "../../../shared/components/ErrorState";
import SidePanel from "../../../shared/components/SidePanel";
import { useAuth } from "../../../shared/context/AuthContext";
import usePermissions from "../../../shared/hooks/usePermissions";

import useBranches from "../../branches/hooks/useBranches";
import useLaboratoryJobs from "../../laboratory/hooks/useLaboratoryJobs";
import PriorityBadge from "../../laboratory/components/PriorityBadge";
import SalesPerformanceChart from "../components/SalesPerformanceChart";
import LabJobDetailPanel from "../../lab/components/LabJobDetailPanel";
import { buildPeriodWindows } from "../../reports/utils";


function formatDeliveryDay(value) {
  if (!value) return "—";

  const target = new Date(value);
  const today = new Date();
  const diffDays = Math.round((new Date(target).setHours(0, 0, 0, 0) - new Date(today).setHours(0, 0, 0, 0)) / 86400000);
  const time = target.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });

  if (diffDays === 0) return `Hoy ${time}`;
  if (diffDays === 1) return `Mañana ${time}`;
  if (diffDays === -1) return `Ayer ${time}`;
  return `${target.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })} ${time}`;
}


// Ultimos 7 dias (el ultimo = "Hoy"): cuenta trabajos terminados por dia,
// para la grafica "Flujo de producción". Las ventanas de fecha son
// compartidas (ver reports/utils.js); el conteo por ventana sigue siendo
// propio de este dashboard.
function buildProductionBuckets(jobs) {
  return buildPeriodWindows("week").map(({ label, from, to }) => ({
    label,
    count: jobs.filter((j) => {
      if (j.status !== "completed" || !j.completedAt) return false;
      const d = new Date(j.completedAt);
      return d >= from && d <= to;
    }).length,
  }));
}


export default function LaboratoryDashboard() {

  const { user: currentUser } = useAuth();
  const { can } = usePermissions();
  const { branches, loading: loadingBranches, error: errorBranches } = useBranches();
  const { jobs, loading: loadingJobs, error: errorJobs, accept, complete, registerLoss, addDetail } = useLaboratoryJobs();

  const [viewingJobId, setViewingJobId] = useState(null);

  const loading = loadingBranches || loadingJobs;
  const error = errorBranches || errorJobs;

  const myBranch = useMemo(
    () => branches.find((b) => b.id === currentUser?.sucursalId),
    [branches, currentUser?.sucursalId]
  );

  // Toda la cola de la sucursal (la registra Ventas), no solo lo propio -
  // igual que LabJobsPage: cualquiera del laboratorio puede aceptar.
  const branchJobs = useMemo(
    () => jobs.filter((j) => j.branchId === myBranch?.id),
    [jobs, myBranch]
  );

  const kpis = useMemo(() => {
    const count = (s) => branchJobs.filter((j) => j.status === s).length;

    return [
      { id: "pending", type: "pendingClock", title: "Por aceptar", color: "orange", value: String(count("pending")), description: "Pendientes" },
      { id: "processing", type: "processingGear", title: "En proceso", color: "purple", value: String(count("processing")), description: "En laboratorio" },
      { id: "completed", type: "confirmed", title: "Terminados", color: "green", value: String(count("completed")), description: "Listos" },
      { id: "loss", type: "lowStock", title: "Mermas", color: "red", value: String(count("loss")), description: "Con incidencia" },
    ];
  }, [branchJobs]);

  const productionData = useMemo(() => buildProductionBuckets(branchJobs), [branchJobs]);

  // Urgentes primero, luego por fecha de entrega mas cercana.
  const acceptQueue = useMemo(
    () =>
      branchJobs
        .filter((j) => j.status === "pending")
        .sort((a, b) => {
          if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
          return new Date(a.requestedDeliveryAt) - new Date(b.requestedDeliveryAt);
        }),
    [branchJobs]
  );

  const myProcessing = useMemo(
    () => branchJobs.filter((j) => j.status === "processing" && j.acceptedBy === currentUser?.name),
    [branchJobs, currentUser?.name]
  );

  const viewingJob = branchJobs.find((j) => j.id === viewingJobId) ?? null;

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  return (

    <PageContainer title="Dashboard Laboratorio" description={myBranch?.name ?? "Control de trabajos de producción."}>

      <div className="flex items-start gap-6">

      <div className="min-w-0 flex-1 space-y-6 transition-all duration-300 ease-in-out">

        <KpiRow items={kpis} />

        <DashboardGrid>

          <div className="col-span-12 xl:col-span-7">
            <ChartContainer
              title={
                <span className="inline-flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-light">
                    <BarChart3 className="h-4 w-4 text-indigo-primary" />
                  </span>
                  Flujo de producción
                </span>
              }
              subtitle="Órdenes procesadas por día"
              align="start"
            >
              <SalesPerformanceChart
                data={productionData}
                dataKey="count"
                valueFormatter={(v) => `${v} órdenes`}
                yTickFormatter={(v) => String(Math.round(v))}
                height={380}
              />
            </ChartContainer>
          </div>

          <div className="col-span-12 flex flex-col gap-6 xl:col-span-5">

            <div className="flex-1">
              <ChartContainer
                title="Cola por aceptar"
                subtitle="Urgentes primero, luego por fecha de entrega."
                action={
                  acceptQueue.length > 0 && (
                    <span className="rounded-full bg-warning/10 px-3 py-1 text-sm font-semibold text-warning">
                      {acceptQueue.length} pendientes
                    </span>
                  )
                }
                align="start"
              >
                {acceptQueue.length === 0 ? (
                  <p className="text-sm text-text-secondary">No hay trabajos pendientes por aceptar.</p>
                ) : (
                  <div className="space-y-3">
                    {acceptQueue.map((job) => (
                      <div key={job.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-text-primary">{job.clientName}</span>
                            <PriorityBadge urgent={job.urgent} />
                          </div>
                          <p className="text-sm text-text-secondary">
                            {job.biselType} · {job.quantity} {job.quantity > 1 ? "pzas" : "pza"} · Vendedor: {job.seller}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Entrega</p>
                            <p className="text-sm font-medium text-text-primary">{formatDeliveryDay(job.requestedDeliveryAt)}</p>
                          </div>
                          <Button className="px-4 py-1.5 text-sm" onClick={() => accept(job.id, currentUser?.name)}>
                            Aceptar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ChartContainer>
            </div>

            <div className="flex-1">
              <ChartContainer title="Mis trabajos en proceso" align="start">
                {myProcessing.length === 0 ? (
                  <p className="text-sm text-text-secondary">No tienes trabajos en proceso.</p>
                ) : (
                  <div className="space-y-3">
                    {myProcessing.map((job) => (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => setViewingJobId(job.id)}
                        className="flex w-full flex-col gap-2 rounded-xl bg-background p-4 text-left transition hover:bg-indigo-light sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-text-primary">{job.clientName}</span>
                            <PriorityBadge urgent={job.urgent} />
                          </div>
                          <p className="text-sm text-text-secondary">
                            {job.biselType} · {job.quantity} {job.quantity > 1 ? "pzas" : "pza"}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-text-primary">Entrega: {formatDeliveryDay(job.requestedDeliveryAt)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </ChartContainer>
            </div>

          </div>

        </DashboardGrid>

      </div>

      <SidePanel
        isOpen={Boolean(viewingJob)}
        onClose={() => setViewingJobId(null)}
        title="Detalle del trabajo"
      >
        <LabJobDetailPanel
          job={viewingJob}
          canAccept={can("laboratory.job.accept")}
          canUpdate={can("laboratory.job.update")}
          onAccept={(job) => accept(job.id, currentUser?.name)}
          onComplete={(job) => complete(job.id, currentUser?.name)}
          onRegisterLoss={(job, reason) => registerLoss(job.id, currentUser?.name, reason)}
          onAddDetail={(job, text) => addDetail(job.id, currentUser?.name, text)}
        />
      </SidePanel>

      </div>

    </PageContainer>

  );

}
