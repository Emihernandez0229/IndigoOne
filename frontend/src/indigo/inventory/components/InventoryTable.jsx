import { Eye } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";
import { getStockStatus } from "../stockStatus";


const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;


export default function InventoryTable({ items = [], onView }) {

  const columns = [
    { key: "displayId", label: "ID" },
    {
      key: "model",
      label: "Producto",
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">{row.model}</p>
          <p className="text-xs text-text-secondary">{row.code}</p>
        </div>
      ),
    },
    { key: "branchName", label: "Sucursal" },
    { key: "stockAvailable", label: "Cantidad disponible" },
    { key: "cost", label: "Precio unitario", render: (row) => currency(row.cost) },
    {
      key: "totalValue",
      label: "Valor total",
      render: (row) => currency(Number(row.stockAvailable ?? 0) * Number(row.cost ?? 0)),
    },
    {
      key: "status",
      label: "Estado",
      render: (row) => <StatusBadge status={getStockStatus(row)} />,
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => (
        <div className="flex items-center gap-1">
          <IconButton icon={Eye} label="Ver" onClick={() => onView(row)} />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={items}
      emptyMessage="No hay productos que coincidan con la búsqueda."
      pageSize={10}
    />
  );

}
