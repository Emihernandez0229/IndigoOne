import { useMemo } from "react";

import Input from "../../../shared/components/Input";
import SelectFilter from "../../../shared/filters/SelectFilter";
import KpiRow from "../../../shared/components/KpiRow";
import ChartContainer from "../../../shared/charts/ChartContainer";
import DataTable from "../../../shared/components/DataTable";

import SalesComparisonList from "../components/SalesComparisonList";
import { QUICK_RANGES, inDateRange, groupByCount } from "../salesReportUtils";

const count = (value) => String(value ?? 0);

function TypeBadges({ nuevo, recurrente, paciente }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {nuevo && <span className="inline-flex items-center rounded-full bg-indigo-light px-2.5 py-1 text-xs font-medium text-indigo-primary">Nuevo</span>}
      {recurrente && <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">Recurrente</span>}
      {paciente && <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">Paciente</span>}
    </div>
  );
}


export default function ClientesReportTab({
  patients, ventas, citas, branches, branchesById,
  branchId, setBranchId, dateFrom, dateTo, quickRange, onQuickRange, onDateFromChange, onDateToChange,
  onClearFilters, branchLocked = false,
}) {

  const branchOptions = useMemo(() => branches.map((b) => ({ value: b.id, label: b.name })), [branches]);

  const patientsById = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);

  const patientsScoped = useMemo(
    () => (branchId ? patients.filter((p) => p.branchId === branchId) : patients),
    [patients, branchId]
  );

  const ventasScoped = useMemo(
    () => ventas.filter((v) =>
      v.status !== "cancelada" &&
      inDateRange(v.createdAt, dateFrom, dateTo) &&
      (!branchId || v.branchId === branchId)
    ),
    [ventas, dateFrom, dateTo, branchId]
  );

  const citasScoped = useMemo(
    () => citas.filter((c) =>
      inDateRange(c.dateTime, dateFrom, dateTo) &&
      (!branchId || c.branchId === branchId)
    ),
    [citas, dateFrom, dateTo, branchId]
  );

  const purchasesByPatient = useMemo(() => {
    const map = new Map();
    ventasScoped.forEach((v) => {
      if (!v.patientId) return;
      const entry = map.get(v.patientId) ?? { count: 0, total: 0 };
      entry.count += 1;
      entry.total += v.total;
      map.set(v.patientId, entry);
    });
    return map;
  }, [ventasScoped]);

  const attendedPatientIds = useMemo(
    () => new Set(citasScoped.filter((c) => c.status === "atendida").map((c) => c.patientId)),
    [citasScoped]
  );

  const nuevosPatients = useMemo(
    () => patientsScoped.filter((p) => inDateRange(p.createdAt, dateFrom, dateTo)),
    [patientsScoped, dateFrom, dateTo]
  );

  const kpis = useMemo(() => {
    const clientesConCompra = purchasesByPatient.size;
    const recurrentes = [...purchasesByPatient.values()].filter((e) => e.count >= 2).length;
    const pctRecurrentes = clientesConCompra ? Math.round((recurrentes / clientesConCompra) * 100) : 0;
    const pacientesAtendidos = attendedPatientIds.size;

    return [
      { id: "nuevos", type: "customers", title: "Nuevos registros", color: "blue", value: String(nuevosPatients.length), description: "En el período" },
      { id: "recurrentes", type: "patients", title: "Clientes recurrentes", color: "purple", value: String(recurrentes), description: `${pctRecurrentes}% de los que compraron` },
      { id: "atendidos", type: "confirmed", title: "Pacientes atendidos", color: "green", value: String(pacientesAtendidos), description: "Con cita atendida" },
      { id: "compra", type: "sales", title: "Clientes con compra", color: "orange", value: String(clientesConCompra), description: "En el período" },
    ];
  }, [purchasesByPatient, attendedPatientIds, nuevosPatients]);

  const nuevosPorSucursal = useMemo(
    () => groupByCount(nuevosPatients, (p) => p.branchId, (p) => branchesById.get(p.branchId) ?? "Sin sucursal"),
    [nuevosPatients, branchesById]
  );

  const composicion = useMemo(() => {
    const clientesConCompra = purchasesByPatient.size;
    const recurrentes = [...purchasesByPatient.values()].filter((e) => e.count >= 2).length;
    return [
      { id: "recurrentes", name: "Recurrentes (2+ compras)", total: recurrentes },
      { id: "unica", name: "Una sola compra", total: Math.max(0, clientesConCompra - recurrentes) },
      { id: "atendidos", name: "Pacientes atendidos", total: attendedPatientIds.size },
    ];
  }, [purchasesByPatient, attendedPatientIds]);

  const activityRows = useMemo(() => {
    const ids = new Set([
      ...purchasesByPatient.keys(),
      ...attendedPatientIds,
      ...nuevosPatients.map((p) => p.id),
    ]);

    return [...ids]
      .map((id) => {
        const patient = patientsById.get(id);
        if (!patient) return null;
        const compras = purchasesByPatient.get(id) ?? { count: 0, total: 0 };
        return {
          id,
          name: patient.name,
          branchName: branchesById.get(patient.branchId) ?? "",
          registro: patient.createdAt,
          compras: compras.count,
          total: compras.total,
          nuevo: nuevosPatients.some((p) => p.id === id),
          recurrente: compras.count >= 2,
          paciente: attendedPatientIds.has(id),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.total - a.total);
  }, [purchasesByPatient, attendedPatientIds, nuevosPatients, patientsById, branchesById]);

  const activityColumns = [
    { key: "name", label: "Cliente", render: (row) => <span className="font-medium text-text-primary">{row.name}</span> },
    ...(branchLocked ? [] : [{ key: "branchName", label: "Sucursal" }]),
    {
      key: "registro",
      label: "Registro",
      render: (row) => row.registro ? new Date(row.registro).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—",
    },
    { key: "compras", label: "Compras" },
    { key: "total", label: "Total", render: (row) => <span className="font-bold text-text-primary">${row.total.toLocaleString("es-MX")}</span> },
    { key: "tipo", label: "Tipo", render: (row) => <TypeBadges nuevo={row.nuevo} recurrente={row.recurrente} paciente={row.paciente} /> },
  ];

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

      <div className={branchLocked ? "grid grid-cols-1" : "grid grid-cols-1 gap-6 xl:grid-cols-2"}>

        {!branchLocked && (
          <ChartContainer title="Nuevos registros por sucursal" subtitle="Pacientes/clientes dados de alta en el período." align="start">
            <SalesComparisonList items={nuevosPorSucursal} formatValue={count} />
          </ChartContainer>
        )}

        <ChartContainer title="Composición de clientes" subtitle="Cómo se distribuyen los clientes con actividad." align="start">
          <SalesComparisonList items={composicion} formatValue={count} />
        </ChartContainer>

      </div>

      <ChartContainer title="Clientes con actividad en el período" subtitle="Nuevos, recurrentes y pacientes atendidos." align="start">
        <DataTable columns={activityColumns} data={activityRows} emptyMessage="Sin actividad de clientes en el período." pageSize={8} />
      </ChartContainer>

    </>
  );

}
