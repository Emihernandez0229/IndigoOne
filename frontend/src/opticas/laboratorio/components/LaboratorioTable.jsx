import { Eye } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";


const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
};

const summarizeItems = (items = []) => {
  if (items.length === 0) return "—";
  if (items.length === 1) return items[0].model || items[0].code;
  return `${items[0].model || items[0].code} + ${items.length - 1} más`;
};


export default function LaboratorioTable({ orders = [], onView }) {

  const columns = [
    { key: "displayId", label: "ID" },
    { key: "patientName", label: "Paciente", render: (row) => row.patientName || "—" },
    { key: "items", label: "Producto", render: (row) => summarizeItems(row.items) },
    { key: "createdAt", label: "Fecha", render: (row) => formatDate(row.createdAt) },
    {
      key: "status",
      label: "Estado",
      render: (row) => <StatusBadge status={row.status} />,
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
      data={orders}
      emptyMessage="No hay órdenes de laboratorio que coincidan con la búsqueda."
    />
  );

}
