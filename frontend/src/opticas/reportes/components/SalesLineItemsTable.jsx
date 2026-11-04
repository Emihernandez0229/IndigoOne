import DataTable from "../../../shared/components/DataTable";

const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;

function formatFecha(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}


/**
 * Listado plano de renglones vendidos (productos y servicios juntos, sin
 * agrupar), con fecha y vendedor de cada uno - para el desglose por
 * sucursal del Dueño (ver VentasReportTab). El total va aparte, abajo de
 * la tabla, para que no se pierda si hay paginación.
 */
export default function SalesLineItemsTable({ rows = [], emptyMessage = "Sin ventas en el período." }) {

  if (!rows.length) {
    return <p className="text-sm text-text-secondary">{emptyMessage}</p>;
  }

  const total = rows.reduce((sum, row) => sum + row.total, 0);

  const columns = [
    {
      key: "item",
      label: "Producto/Servicio",
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">{row.itemName}</p>
          <p className="text-xs text-text-secondary">{row.itemType === "servicio" ? "Servicio" : "Producto"}</p>
        </div>
      ),
    },
    { key: "fecha", label: "Fecha", render: (row) => formatFecha(row.fecha) },
    { key: "vendedor", label: "Vendedor", render: (row) => row.vendedor || "—" },
    { key: "cantidad", label: "Cant." },
    { key: "total", label: "Total", render: (row) => <span className="font-semibold text-text-primary">{currency(row.total)}</span> },
    {
      key: "pct",
      label: "% del total",
      render: (row) => `${total ? Math.round((row.total / total) * 1000) / 10 : 0}%`,
    },
  ];

  return (
    <div className="space-y-3">
      <DataTable columns={columns} data={rows} pageSize={10} />
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-background px-5 py-3">
        <span className="text-sm font-semibold text-text-primary">Total</span>
        <span className="text-base font-bold text-text-primary">{currency(total)}</span>
      </div>
    </div>
  );

}
