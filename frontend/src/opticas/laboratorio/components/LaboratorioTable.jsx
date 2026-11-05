import { Eye } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";
import PriorityBadge from "../../ventas/components/PriorityBadge";
import { WORK_TYPES } from "../../ventas/constants";
import { currency } from "../../../shared/utils/format";

const workTypeLabel = (value) =>
  WORK_TYPES.find((option) => option.value === value)?.label ?? value;

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
    { key: "folio", label: "Folio", render: (row) => row.folio || "—" },
    { key: "patientName", label: "Paciente", render: (row) => row.patientName || "—" },
    { key: "branchName", label: "Sucursal", render: (row) => row.branchName || "—" },
    { key: "sellerName", label: "Vendedor", render: (row) => row.sellerName || "—" },
    { key: "workType", label: "Trabajo", render: (row) => <span className="font-bold text-text-primary">{workTypeLabel(row.workType)}</span> },
    { key: "items", label: "Producto", render: (row) => summarizeItems(row.items) },
    { key: "total", label: "Total", render: (row) => <span className="font-bold text-text-primary">{currency(row.total)}</span> },
    { key: "createdAt", label: "Fecha", render: (row) => formatDate(row.createdAt) },
    { key: "priority", label: "Prioridad", render: (row) => <PriorityBadge priority={row.priority} /> },
    {
      key: "status",
      label: "Estado",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "paymentStatus",
      label: "Pagos",
      render: (row) => (row.paymentStatus ? <StatusBadge status={row.paymentStatus} /> : "—"),
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
      pageSize={10}
    />
  );

}
