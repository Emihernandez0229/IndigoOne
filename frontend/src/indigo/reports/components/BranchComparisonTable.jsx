import { useState } from "react";
import { Eye } from "lucide-react";

import DataTable from "../../../shared/components/DataTable";
import IconButton from "../../../shared/components/IconButton";
import { CHART_COLORS } from "../../../shared/charts/chartTheme";
import { categoryOf, pct } from "../utils";
import JobDetailTable from "./JobDetailTable";


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


function EffectivenessPct({ value, isWorst, isTotal }) {
  const color = isTotal ? CHART_COLORS.primary : isWorst ? CHART_COLORS.error : CHART_COLORS.success;
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


export default function BranchComparisonTable({ branches = [] }) {

  const [viewingId, setViewingId] = useState(null);

  const totals = branches.reduce(
    (acc, b) => ({
      total: acc.total + b.total,
      completed: acc.completed + b.completed,
      processing: acc.processing + b.processing,
      pending: acc.pending + b.pending,
      merma: acc.merma + b.merma,
    }),
    { total: 0, completed: 0, processing: 0, pending: 0, merma: 0 }
  );

  const withEffectiveness = branches.map((b) => {
    const resolved = b.completed + b.merma;
    return { ...b, effectiveness: resolved > 0 ? Math.round((b.completed / resolved) * 1000) / 10 : 100 };
  });

  const worst = withEffectiveness.reduce((acc, b) => (!acc || b.pctMerma > acc.pctMerma ? b : acc), null);

  const totalResolved = totals.completed + totals.merma;
  const totalRow = {
    id: "__total__",
    name: "Total global",
    ...totals,
    pctCompleted: pct(totals.completed, totals.total),
    pctMerma: pct(totals.merma, totals.total),
    effectiveness: totalResolved > 0 ? Math.round((totals.completed / totalResolved) * 1000) / 10 : 100,
    jobs: branches.flatMap((b) => b.jobs ?? []),
  };

  const rows = branches.length ? [...withEffectiveness, totalRow] : [];

  const viewingRow = rows.find((r) => r.id === viewingId) ?? null;

  const columns = [
    {
      key: "name",
      label: "Sucursal",
      render: (row) => (
        <span className="flex items-center gap-2">
          <span className={row.id === "__total__" ? "font-bold text-indigo-primary" : "font-medium text-text-primary"}>{row.name}</span>
          {worst && row.id === worst.id && row.pctMerma > 0 && (
            <span className="rounded-full bg-error/10 px-2 py-0.5 text-xs font-medium text-error">Mayor merma</span>
          )}
        </span>
      ),
    },
    { key: "total", label: "Trabajos totales", render: (row) => <span className="font-bold text-text-primary">{row.total}</span> },
    { key: "completed", label: "Terminados", render: (row) => <span className="font-bold text-text-primary">{row.completed}</span> },
    { key: "processing", label: "En proceso" },
    { key: "pending", label: "Pendientes" },
    { key: "merma", label: "Mermas" },
    { key: "pctCompleted", label: "% Terminado", render: (row) => <CompletedBar pct={row.pctCompleted} /> },
    { key: "pctMerma", label: "% Merma", render: (row) => <MermaPct pct={row.pctMerma} isTotal={row.id === "__total__"} /> },
    {
      key: "effectiveness",
      label: "% Efectividad",
      render: (row) => (
        <EffectivenessPct value={row.effectiveness} isWorst={worst && row.id === worst.id} isTotal={row.id === "__total__"} />
      ),
    },
    {
      key: "actions",
      label: "Detalle",
      render: (row) => <IconButton icon={Eye} label="Ver detalle" onClick={() => setViewingId(row.id)} />,
    },
  ];

  return (
    <div>

      <DataTable
        columns={columns}
        data={rows}
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
            <JobGroup title="Terminados" jobs={(viewingRow.jobs ?? []).filter((j) => categoryOf(j) === "completed")} color={CHART_COLORS.success} />
            <JobGroup title="En proceso" jobs={(viewingRow.jobs ?? []).filter((j) => categoryOf(j) === "processing")} color={CHART_COLORS.secondary} />
            <JobGroup title="Pendientes" jobs={(viewingRow.jobs ?? []).filter((j) => categoryOf(j) === "pending")} color={CHART_COLORS.warning} />
            <JobGroup title="Mermas" jobs={(viewingRow.jobs ?? []).filter((j) => categoryOf(j) === "merma")} color={CHART_COLORS.error} />
          </div>

        </div>
      )}

    </div>
  );

}
