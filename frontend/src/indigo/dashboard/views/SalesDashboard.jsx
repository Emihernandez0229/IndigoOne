import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

import PageContainer from "../../../shared/layouts/PageContainer";
import KpiRow from "../../../shared/components/KpiRow";
import DashboardGrid from "../../../shared/dashboard/DashboardGrid";
import ChartContainer from "../../../shared/charts/ChartContainer";
import DonutChart from "../../../shared/charts/DonutChart";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import ErrorState from "../../../shared/components/ErrorState";
import { useAuth } from "../../../shared/context/AuthContext";

import useLaboratoryJobs from "../../laboratory/hooks/useLaboratoryJobs";
import PriorityBadge from "../../laboratory/components/PriorityBadge";
import { LAB_STATUS_LABELS } from "../../laboratory/constants";
import { getPeriodRange, inRange, pct } from "../../reports/utils";
import { CHART_COLORS } from "../../../shared/charts/chartTheme";


const STATUS_PILLS = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "processing", label: "En proceso" },
  { value: "completed", label: "Terminado" },
  { value: "loss", label: "Merma" },
];


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


function formatTime(value) {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
}


export default function SalesDashboard() {

  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { jobs, loading, error } = useLaboratoryJobs();

  const [statusFilter, setStatusFilter] = useState("");

  // Lo que el empleado registro el mismo - sin importar a quien se le dio
  // el credito de la venta (campo `seller`, puede ser otra persona).
  const myJobs = useMemo(
    () => jobs.filter((j) => j.registeredById === currentUser?.id),
    [jobs, currentUser?.id]
  );

  const counts = useMemo(() => {
    const count = (s) => myJobs.filter((j) => j.status === s).length;
    return { pending: count("pending"), processing: count("processing"), completed: count("completed"), loss: count("loss") };
  }, [myJobs]);

  const kpis = useMemo(() => {
    const monthRange = getPeriodRange("month");
    const salesThisMonth = myJobs
      .filter((j) => inRange(j.entryAt, monthRange))
      .reduce((sum, j) => sum + (j.amount || 0), 0);

    return [
      { id: "total", type: "orders", title: "Trabajos registrados por mí", color: "blue", value: String(myJobs.length), description: "En total" },
      { id: "pending", type: "pendingClock", title: "Trabajos pendientes", color: "orange", value: String(counts.pending), description: "Por aceptar" },
      { id: "processing", type: "processingGear", title: "Trabajos en proceso", color: "purple", value: String(counts.processing), description: "En laboratorio" },
      { id: "sales", type: "revenue", title: "Ventas del mes", color: "green", value: `$${salesThisMonth.toLocaleString("es-MX")}`, description: "Últimos 30 días" },
    ];
  }, [myJobs, counts]);

  const recentJobs = useMemo(() => {
    const filtered = statusFilter ? myJobs.filter((j) => j.status === statusFilter) : myJobs;
    return [...filtered].sort((a, b) => new Date(b.entryAt) - new Date(a.entryAt)).slice(0, 10);
  }, [myJobs, statusFilter]);

  const statusDonut = useMemo(() => {
    const total = myJobs.length;
    return [
      { label: "Pendientes", value: counts.pending, percent: pct(counts.pending, total), color: CHART_COLORS.warning },
      { label: "En proceso", value: counts.processing, percent: pct(counts.processing, total), color: CHART_COLORS.secondary },
      { label: "Terminados", value: counts.completed, percent: pct(counts.completed, total), color: CHART_COLORS.success },
      { label: "Mermas", value: counts.loss, percent: pct(counts.loss, total), color: CHART_COLORS.error },
    ];
  }, [myJobs, counts]);

  const readyToDeliver = useMemo(
    () =>
      myJobs
        .filter((j) => j.status === "completed" && !j.deliveredAt)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 5),
    [myJobs]
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  const columns = [
    { key: "clientName", label: "Cliente" },
    { key: "biselType", label: "Bisel" },
    { key: "quantity", label: "Cant." },
    { key: "priority", label: "Servicio", render: (row) => <PriorityBadge urgent={row.urgent} /> },
    { key: "requestedDeliveryAt", label: "Entrega", render: (row) => formatDeliveryDay(row.requestedDeliveryAt) },
    {
      key: "status",
      label: "Estado",
      render: (row) => <StatusBadge status={row.status} label={LAB_STATUS_LABELS[row.status]} />,
    },
  ];

  return (

    <PageContainer
      title="Dashboard Ventas"
      description="Resumen de tus trabajos registrados."
    >

      <div className="space-y-6">

        <KpiRow items={kpis} />

        <DashboardGrid>

          <div className="col-span-12 xl:col-span-7">
            <ChartContainer
              title="Mis trabajos recientes"
              align="start"
              action={
                <div className="flex flex-wrap items-center gap-1 rounded-xl border border-gray-200 bg-background p-1">
                  {STATUS_PILLS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setStatusFilter(p.value)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        statusFilter === p.value ? "bg-indigo-primary text-white" : "text-text-secondary hover:bg-surface"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              }
            >
              <DataTable columns={columns} data={recentJobs} emptyMessage="No has registrado trabajos todavía." />

              <button
                type="button"
                onClick={() => navigate("/indigo/trabajos")}
                className="mt-4 text-sm font-medium text-indigo-primary hover:underline"
              >
                Ver todos mis trabajos →
              </button>
            </ChartContainer>
          </div>

          <div className="col-span-12 flex flex-col gap-6 xl:col-span-5">

            <div className="flex-1">
              <ChartContainer title="Mis trabajos por estado" align="start">
                <DonutChart data={statusDonut} centerLabel="trabajos totales" />
              </ChartContainer>
            </div>

            <div className="flex-1">
              <ChartContainer title="Listos para entregar" subtitle="Terminados por laboratorio, avisa a la óptica." align="start">
                {readyToDeliver.length === 0 ? (
                  <p className="text-sm text-text-secondary">Sin trabajos listos por entregar.</p>
                ) : (
                  <div className="space-y-3">
                    {readyToDeliver.map((job) => (
                      <div key={job.id} className="flex items-start gap-3 rounded-xl bg-success/10 p-4">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                        <div>
                          <p className="font-medium text-text-primary">{job.clientName}</p>
                          <p className="text-sm text-text-secondary">
                            {job.biselType} · {job.quantity} {job.quantity > 1 ? "piezas" : "pieza"}
                            {job.urgent ? " · urgente" : ""} · terminado {formatTime(job.completedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ChartContainer>
            </div>

          </div>

        </DashboardGrid>

      </div>

    </PageContainer>

  );

}
