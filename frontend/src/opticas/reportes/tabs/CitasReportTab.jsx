import { useEffect, useMemo, useState } from "react";

import Input from "../../../shared/components/Input";
import SelectFilter from "../../../shared/filters/SelectFilter";
import KpiRow from "../../../shared/components/KpiRow";
import ChartContainer from "../../../shared/charts/ChartContainer";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import { CHART_COLORS } from "../../../shared/charts/chartTheme";

import SalesComparisonList from "../components/SalesComparisonList";
import StatusDistributionBar from "../components/StatusDistributionBar";
import { CITA_STATUSES } from "../../citas/constants";
import { QUICK_RANGES, inDateRange, groupByCount, toCsv } from "../salesReportUtils";

const count = (value) => String(value ?? 0);

function formatFecha(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function formatHora(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}


export default function CitasReportTab({
  citas, patients, users, branches, branchesById,
  branchId, setBranchId, dateFrom, dateTo, quickRange, onQuickRange, onDateFromChange, onDateToChange,
  onClearFilters, onExportReady, branchLocked = false,
}) {

  const [employeeName, setEmployeeName] = useState("");
  const [estado, setEstado] = useState("");

  const branchOptions = useMemo(() => branches.map((b) => ({ value: b.id, label: b.name })), [branches]);

  const patientsById = useMemo(() => new Map(patients.map((p) => [p.id, p.name])), [patients]);
  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u.name])), [users]);

  const citasEnriquecidas = useMemo(
    () => citas.map((c) => ({
      ...c,
      patientName: patientsById.get(c.patientId) ?? "—",
      branchName: branchesById.get(c.branchId) ?? "",
      employeeName: usersById.get(c.createdBy) ?? "—",
    })),
    [citas, patientsById, branchesById, usersById]
  );

  const employeeOptions = useMemo(() => {
    const pool = branchId ? citasEnriquecidas.filter((c) => c.branchId === branchId) : citasEnriquecidas;
    const names = [...new Set(pool.map((c) => c.employeeName).filter((n) => n && n !== "—"))].sort();
    return names.map((name) => ({ value: name, label: name }));
  }, [citasEnriquecidas, branchId]);

  const scopedCitas = useMemo(
    () => citasEnriquecidas.filter((c) =>
      inDateRange(c.dateTime, dateFrom, dateTo) &&
      (!branchId || c.branchId === branchId) &&
      (!employeeName || c.employeeName === employeeName) &&
      (!estado || c.status === estado)
    ),
    [citasEnriquecidas, dateFrom, dateTo, branchId, employeeName, estado]
  );

  const total = scopedCitas.length;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  const atendidas = scopedCitas.filter((c) => c.status === "atendida").length;
  const canceladas = scopedCitas.filter((c) => c.status === "cancelada").length;
  const noAsistio = scopedCitas.filter((c) => c.status === "no_asistio").length;

  const kpis = [
    { id: "total", type: "appointments", title: "Citas en el período", color: "blue", value: String(total), description: "En el período" },
    { id: "atendidas", type: "confirmed", title: "Atendidas", color: "green", value: String(atendidas), description: `${pct(atendidas)}%` },
    { id: "canceladas", type: "canceled", title: "Canceladas", color: "red", value: String(canceladas), description: `${pct(canceladas)}%` },
    { id: "noConcretadas", type: "lowStock", title: "No concretadas", color: "orange", value: String(noAsistio), description: `${pct(noAsistio)}% · paciente no asistió` },
  ];

  const segments = [
    { id: "atendida", label: "Atendida", count: atendidas, pct: pct(atendidas), color: CHART_COLORS.success },
    { id: "cancelada", label: "Cancelada", count: canceladas, pct: pct(canceladas), color: CHART_COLORS.error },
    { id: "no_asistio", label: "No asistió", count: noAsistio, pct: pct(noAsistio), color: CHART_COLORS.orange },
  ];

  // Con una sola sucursal, "por sucursal" no aporta: se compara por
  // empleado en su lugar.
  const comparisonItems = useMemo(
    () => branchLocked
      ? groupByCount(scopedCitas, (c) => c.employeeName, (c) => c.employeeName)
      : groupByCount(scopedCitas, (c) => c.branchId, (c) => c.branchName || "Sin sucursal"),
    [branchLocked, scopedCitas]
  );
  const comparisonTitle = branchLocked ? "Citas por empleado" : "Citas por sucursal";
  const comparisonSubtitle = branchLocked
    ? "Número de citas registradas por empleado."
    : "Número de citas registradas por sucursal.";

  const listadoRows = useMemo(
    () => [...scopedCitas].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)),
    [scopedCitas]
  );

  const columns = [
    { key: "fecha", label: "Fecha", render: (row) => formatFecha(row.dateTime) },
    { key: "hora", label: "Hora", render: (row) => formatHora(row.dateTime) },
    { key: "patientName", label: "Paciente", render: (row) => <span className="font-medium text-text-primary">{row.patientName}</span> },
    { key: "reason", label: "Servicio" },
    { key: "employeeName", label: "Atiende" },
    ...(branchLocked ? [] : [{ key: "branchName", label: "Sucursal" }]),
    { key: "status", label: "Estado", render: (row) => <StatusBadge status={row.status} /> },
  ];

  useEffect(() => {
    onExportReady({
      filename: `reporte-citas-${dateFrom}-a-${dateTo}.csv`,
      csv: toCsv(listadoRows, [
        { label: "Fecha", value: (row) => formatFecha(row.dateTime) },
        { label: "Hora", value: (row) => formatHora(row.dateTime) },
        { label: "Paciente", value: (row) => row.patientName },
        { label: "Servicio", value: (row) => row.reason },
        { label: "Atiende", value: (row) => row.employeeName },
        ...(branchLocked ? [] : [{ label: "Sucursal", value: (row) => row.branchName }]),
        { label: "Estado", value: (row) => row.status },
      ]),
    });
  }, [listadoRows, dateFrom, dateTo, onExportReady, branchLocked]);


  return (
    <>

      <div className="space-y-4 rounded-2xl border border-gray-200 bg-surface p-4">

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-secondary">Período</label>
            <div className="flex items-center gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} />
              <span className="text-text-secondary">a</span>
              <Input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} />
            </div>
          </div>
          {!branchLocked && (
            <SelectFilter label="Sucursal" value={branchId} onChange={setBranchId} placeholder="Todas" options={branchOptions} />
          )}
          <SelectFilter label="Empleado" value={employeeName} onChange={setEmployeeName} placeholder="Todos" options={employeeOptions} />
          <SelectFilter label="Estado" value={estado} onChange={setEstado} placeholder="Todos" options={CITA_STATUSES} />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {QUICK_RANGES.map((qr) => (
              <button
                key={qr.value}
                type="button"
                onClick={() => onQuickRange(qr.value, qr.days)}
                className={`text-sm font-medium transition ${
                  quickRange === qr.value ? "text-indigo-primary" : "text-text-secondary hover:text-indigo-primary"
                }`}
              >
                {qr.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClearFilters} className="pb-2 text-sm font-medium text-indigo-primary hover:underline">
            Limpiar filtros
          </button>
        </div>

      </div>

      <KpiRow items={kpis} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        <ChartContainer title="Distribución por estado" subtitle="Proporción de citas por estado en el período." align="start">
          <StatusDistributionBar segments={segments} />
        </ChartContainer>

        <ChartContainer title={comparisonTitle} subtitle={comparisonSubtitle} align="start">
          <SalesComparisonList items={comparisonItems} formatValue={count} />
        </ChartContainer>

      </div>

      <ChartContainer title="Listado de citas" subtitle="Citas que coinciden con los filtros seleccionados." align="start">
        <DataTable columns={columns} data={listadoRows} emptyMessage="Sin citas en el período." pageSize={8} />
      </ChartContainer>

    </>
  );

}
