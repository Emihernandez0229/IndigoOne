import { useMemo } from "react";

import DashboardLayout from "../../../shared/dashboard/DashboardLayout";
import DashboardGrid from "../../../shared/dashboard/DashboardGrid";
import DashboardPanel from "../../../shared/dashboard/DashboardPanel";
import StatusBadge from "../../../shared/components/StatusBadge";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import ErrorState from "../../../shared/components/ErrorState";

import { useAuth } from "../../../shared/context/AuthContext";

import useVentas from "../../ventas/hooks/useVentas";
import useCitas from "../../citas/hooks/useCitas";
import usePatients from "../../pacientes/hooks/usePatients";

import TodayAgendaCalendar from "../components/TodayAgendaCalendar";

import { inDateRange, quickRangeDates } from "../../reportes/salesReportUtils";
import { currency, formatFecha } from "../../../shared/utils/format";


/**
 * Dashboard del Empleado de Ventas: a propósito mucho más corto que el de
 * Dueño/Jefe - solo lo suyo (sus ventas, las citas de hoy de su sucursal),
 * sin comparativos, sin inventario y sin ver el desempeño de otros
 * compañeros.
 */
export default function SalesDashboardOpticas() {

  const { user: currentUser } = useAuth();
  const branchId = currentUser?.sucursalId ?? "";

  const { ventas, loading: loadingVentas, error } = useVentas(branchId);
  const { citas, loading: loadingCitas } = useCitas(branchId);
  const { patients, loading: loadingPatients } = usePatients(branchId);

  const patientsById = useMemo(() => new Map(patients.map((p) => [p.id, p.name])), [patients]);

  const misVentas = useMemo(
    () => ventas.filter((v) => v.createdBy === currentUser?.id),
    [ventas, currentUser?.id]
  );

  const ventasHoy = useMemo(() => {
    const { from, to } = quickRangeDates(1);
    return misVentas.filter((v) => v.status !== "cancelada" && inDateRange(v.createdAt, from, to));
  }, [misVentas]);

  // "Este mes" = últimos 30 días, mismo criterio que usa el resto de la app
  // para "Mes" (no es mes de calendario).
  const ventasMes = useMemo(() => {
    const { from, to } = quickRangeDates(30);
    return misVentas.filter((v) => v.status !== "cancelada" && inDateRange(v.createdAt, from, to));
  }, [misVentas]);

  const citasHoy = useMemo(() => {
    const today = new Date();
    return citas.filter((c) => {
      const d = new Date(c.dateTime);
      return !Number.isNaN(d.getTime())
        && d.getFullYear() === today.getFullYear()
        && d.getMonth() === today.getMonth()
        && d.getDate() === today.getDate();
    });
  }, [citas]);

  const kpis = useMemo(() => {
    const totalHoy = ventasHoy.reduce((sum, v) => sum + v.total, 0);
    const totalMes = ventasMes.reduce((sum, v) => sum + v.total, 0);
    return [
      { id: "ventas", type: "sales", title: "Mis ventas hoy", color: "blue", value: currency(totalHoy), description: `Este mes: ${currency(totalMes)}` },
      { id: "citas", type: "appointments", title: "Citas de hoy", color: "purple", value: String(citasHoy.length), description: "En tu sucursal" },
    ];
  }, [ventasHoy, ventasMes, citasHoy]);

  const citasEnriquecidas = useMemo(
    () => citas.map((c) => ({ ...c, patientName: patientsById.get(c.patientId) ?? "Paciente" })),
    [citas, patientsById]
  );

  const ultimasVentas = useMemo(
    () => [...misVentas].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6),
    [misVentas]
  );


  const loading = loadingVentas || loadingCitas || loadingPatients;

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;


  return (

    <DashboardLayout
      title="Dashboard Ventas"
      subtitle="Tus ventas y la agenda de hoy."
      kpis={kpis}
    >

      <DashboardGrid>

        <div className="col-span-12 h-full xl:col-span-7">

          <DashboardPanel title="Mis últimas ventas" subtitle="Tus operaciones más recientes." className="h-full">

            {ultimasVentas.length === 0 ? (
              <p className="text-sm text-text-secondary">Aún no tienes ventas registradas.</p>
            ) : (
              <div className="space-y-3">
                {ultimasVentas.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                    <div>
                      <p className="font-medium text-text-primary">{patientsById.get(v.patientId) ?? "Paciente"}</p>
                      <p className="text-sm text-text-secondary">{v.folio} · {formatFecha(v.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={v.paymentStatus} />
                      <span className="font-semibold text-indigo-primary">{currency(v.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </DashboardPanel>

        </div>

        <div className="col-span-12 h-full xl:col-span-5">
          <TodayAgendaCalendar citas={citasEnriquecidas} />
        </div>

      </DashboardGrid>

    </DashboardLayout>

  );

}
