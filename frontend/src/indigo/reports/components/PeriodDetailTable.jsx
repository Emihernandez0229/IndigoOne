import { useMemo, useState } from "react";
import { Eye } from "lucide-react";

import DataTable from "../../../shared/components/DataTable";
import IconButton from "../../../shared/components/IconButton";
import { CHART_COLORS } from "../../../shared/charts/chartTheme";
import { categoryOf, pct, formatShortDate, formatAxisDate } from "../utils";
import JobDetailTable from "./JobDetailTable";


const GRANULARITIES = [
  { value: "day", label: "Día" },
  { value: "month", label: "Mes" },
  { value: "months", label: "Meses" },
];

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];


function statsForRange(jobs, from, to, label) {
  const scoped = jobs.filter((j) => {
    const d = new Date(j.entryAt);
    return d >= from && d <= to;
  });

  const total = scoped.length;
  const completed = scoped.filter((j) => categoryOf(j) === "completed").length;
  const processing = scoped.filter((j) => categoryOf(j) === "processing").length;
  const pending = scoped.filter((j) => categoryOf(j) === "pending").length;
  const merma = scoped.filter((j) => categoryOf(j) === "merma").length;
  const resolved = completed + merma;

  return {
    id: label,
    name: label,
    total, completed, processing, pending, merma,
    pctCompleted: pct(completed, total),
    pctMerma: pct(merma, total),
    effectiveness: resolved > 0 ? Math.round((completed / resolved) * 1000) / 10 : 100,
    jobs: scoped,
  };
}


// Dia: ultimos 14 dias. Mes: ultimas 4 semanas (dentro del mes en curso).
// Meses: ultimos 12 meses.
function buildRows(jobs, granularity) {
  const now = new Date();

  if (granularity === "day") {
    const rows = [];
    for (let i = 13; i >= 0; i--) {
      const day = new Date(now); day.setDate(now.getDate() - i);
      const from = new Date(day); from.setHours(0, 0, 0, 0);
      const to = new Date(day); to.setHours(23, 59, 59, 999);
      rows.push(statsForRange(jobs, from, to, formatShortDate(day)));
    }
    return rows;
  }

  if (granularity === "month") {
    const rows = [];
    for (let i = 3; i >= 0; i--) {
      const to = new Date(now); to.setDate(now.getDate() - i * 7);
      const from = new Date(to); from.setDate(to.getDate() - 6); from.setHours(0, 0, 0, 0);
      rows.push(statsForRange(jobs, from, to, `${formatAxisDate(from)} – ${formatAxisDate(to)}`));
    }
    return rows;
  }

  const rows = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const from = new Date(d.getFullYear(), d.getMonth(), 1);
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    rows.push(statsForRange(jobs, from, to, `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`));
  }
  return rows;
}


function CompletedBar({ pct: value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-background">
        <div className="h-full rounded-full bg-success" style={{ width: `${value}%` }} />
      </div>
      <span className="text-sm text-text-secondary">{value}%</span>
    </div>
  );
}


function MermaPct({ pct: value, isTotal }) {
  const color = isTotal ? CHART_COLORS.primary : value >= 5 ? CHART_COLORS.error : value >= 3 ? CHART_COLORS.warning : undefined;
  return <span className={`text-sm font-bold ${color ? "" : "text-text-secondary"}`} style={color ? { color } : undefined}>{value}%</span>;
}


function EffectivenessPct({ value, isTotal }) {
  const color = isTotal ? CHART_COLORS.primary : value >= 93 ? CHART_COLORS.success : CHART_COLORS.error;
  return <span className="text-sm font-bold" style={{ color }}>{value}%</span>;
}


function StatChip({ label, value, color }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="mt-1 text-lg font-bold" style={{ color: color ?? undefined }}>{value}</p>
    </div>
  );
}


function JobGroup({ title, jobs, color }) {
  if (!jobs.length) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold" style={{ color }}>{title} ({jobs.length})</p>
      <JobDetailTable jobs={jobs} showStatus={false} />
    </div>
  );
}


/**
 * "Detalle por día, mes y meses" (Reportes - Gerente/Subgerente): mismo
 * diseño de BranchComparisonTable pero las filas son periodos de tiempo de
 * esta sucursal, no sucursales distintas.
 */
export default function PeriodDetailTable({ jobs = [] }) {

  const [granularity, setGranularity] = useState("day");
  const [viewingId, setViewingId] = useState(null);

  const rows = useMemo(() => buildRows(jobs, granularity), [jobs, granularity]);

  const totals = rows.reduce(
    (acc, r) => ({
      total: acc.total + r.total,
      completed: acc.completed + r.completed,
      processing: acc.processing + r.processing,
      pending: acc.pending + r.pending,
      merma: acc.merma + r.merma,
    }),
    { total: 0, completed: 0, processing: 0, pending: 0, merma: 0 }
  );

  const totalResolved = totals.completed + totals.merma;
  const totalRow = {
    id: "__total__",
    name: "Total del periodo",
    ...totals,
    pctCompleted: pct(totals.completed, totals.total),
    pctMerma: pct(totals.merma, totals.total),
    effectiveness: totalResolved > 0 ? Math.round((totals.completed / totalResolved) * 1000) / 10 : 100,
    jobs: rows.flatMap((r) => r.jobs),
  };

  const allRows = rows.length ? [...rows, totalRow] : [];

  const viewingRow = allRows.find((r) => r.id === viewingId) ?? null;

  const columns = [
    {
      key: "name",
      label: "Periodo",
      render: (row) => (
        <span className={row.id === "__total__" ? "font-bold text-indigo-primary" : "font-medium text-text-primary"}>{row.name}</span>
      ),
    },
    { key: "total", label: "Trabajos totales", render: (row) => <span className="font-bold text-text-primary">{row.total}</span> },
    { key: "completed", label: "Terminados", render: (row) => <span className="font-bold text-text-primary">{row.completed}</span> },
    { key: "processing", label: "En proceso" },
    { key: "pending", label: "Pendientes" },
    { key: "merma", label: "Mermas" },
    { key: "pctCompleted", label: "% Terminado", render: (row) => <CompletedBar pct={row.pctCompleted} /> },
    { key: "pctMerma", label: "% Merma", render: (row) => <MermaPct pct={row.pctMerma} isTotal={row.id === "__total__"} /> },
    { key: "effectiveness", label: "% Efectividad", render: (row) => <EffectivenessPct value={row.effectiveness} isTotal={row.id === "__total__"} /> },
    {
      key: "actions",
      label: "Detalle",
      render: (row) => <IconButton icon={Eye} label="Ver detalle" onClick={() => setViewingId(row.id)} />,
    },
  ];

  return (
    <div>

      <div className="mb-4 flex justify-end">
        <div className="inline-flex rounded-xl border border-gray-200 bg-surface p-1">
          {GRANULARITIES.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGranularity(g.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                granularity === g.value ? "bg-indigo-primary text-white" : "text-text-secondary hover:bg-background"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={allRows}
        emptyMessage="Sin información disponible"
        rowClassName={(row) => (row.id === "__total__" ? "bg-indigo-light font-semibold" : "")}
      />

      {viewingRow && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-background p-5">

          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">Detalle de {viewingRow.name}</h3>
            <button type="button" onClick={() => setViewingId(null)} className="text-sm font-medium text-indigo-primary hover:underline">
              Cerrar
            </button>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            <StatChip label="Totales" value={viewingRow.total} />
            <StatChip label="Terminados" value={viewingRow.completed} color={CHART_COLORS.success} />
            <StatChip label="En proceso" value={viewingRow.processing} color={CHART_COLORS.secondary} />
            <StatChip label="Pendientes" value={viewingRow.pending} color={CHART_COLORS.warning} />
            <StatChip label="Mermas" value={viewingRow.merma} color={CHART_COLORS.error} />
            <StatChip label="% Merma" value={`${viewingRow.pctMerma}%`} color={CHART_COLORS.error} />
            <StatChip label="% Efectividad" value={`${viewingRow.effectiveness}%`} color={CHART_COLORS.primary} />
          </div>

          <div className="space-y-5">
            <JobGroup title="Terminados" jobs={viewingRow.jobs.filter((j) => categoryOf(j) === "completed")} color={CHART_COLORS.success} />
            <JobGroup title="En proceso" jobs={viewingRow.jobs.filter((j) => categoryOf(j) === "processing")} color={CHART_COLORS.secondary} />
            <JobGroup title="Pendientes" jobs={viewingRow.jobs.filter((j) => categoryOf(j) === "pending")} color={CHART_COLORS.warning} />
            <JobGroup title="Mermas" jobs={viewingRow.jobs.filter((j) => categoryOf(j) === "merma")} color={CHART_COLORS.error} />
          </div>

        </div>
      )}

    </div>
  );

}
