import DataTable from "../../../shared/components/DataTable";
import { pct } from "../utils";


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


function MermaPill({ pct: value }) {
  return (
    <span className="inline-flex items-center rounded-full bg-error/10 px-2.5 py-1 text-xs font-medium text-error">
      {value}%
    </span>
  );
}


export default function BranchComparisonTable({ branches = [] }) {

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

  const totalRow = {
    id: "__total__",
    name: "Total global",
    ...totals,
    pctCompleted: pct(totals.completed, totals.total),
    pctMerma: pct(totals.merma, totals.total),
  };

  const rows = branches.length ? [...branches, totalRow] : [];

  const columns = [
    { key: "name", label: "Sucursal" },
    { key: "total", label: "Total" },
    { key: "completed", label: "Terminados" },
    { key: "processing", label: "En proceso" },
    { key: "pending", label: "Pendientes" },
    { key: "merma", label: "Mermas" },
    { key: "pctCompleted", label: "% Terminado", render: (row) => <CompletedBar pct={row.pctCompleted} /> },
    { key: "pctMerma", label: "% Merma", render: (row) => <MermaPill pct={row.pctMerma} /> },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyMessage="Sin información disponible"
      rowClassName={(row) => (row.id === "__total__" ? "bg-background font-semibold" : "")}
    />
  );

}
