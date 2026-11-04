import DashboardPanel from "../../../shared/dashboard/DashboardPanel";
import DataTable from "../../../shared/components/DataTable";

export default function CriticalStockTable({ rows = [], showBranch = true }) {

  const columns = [
    { key: "code", label: "SKU", render: (row) => <span className="text-text-secondary">{row.code}</span> },
    { key: "name", label: "Producto", render: (row) => <span className="font-medium text-text-primary">{row.name}</span> },
    ...(showBranch ? [{ key: "branchName", label: "Sucursal" }] : []),
    {
      key: "stock",
      label: "Stock",
      render: (row) => (
        <span className={`font-bold ${row.stock <= 0 ? "text-error" : "text-warning"}`}>{row.stock}</span>
      ),
    },
    { key: "stockMin", label: "Mín.", render: (row) => <span className="text-text-secondary">{row.stockMin}</span> },
  ];

  return (

    <DashboardPanel
      title="Stock crítico"
      subtitle="Productos bajo mínimo"
      className="h-full"
    >

      {rows.length === 0 ? (
        <p className="text-sm text-text-secondary">Sin productos bajo el mínimo por ahora.</p>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}

    </DashboardPanel>

  );

}
