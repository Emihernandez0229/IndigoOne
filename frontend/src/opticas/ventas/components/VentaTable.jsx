import { Eye } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";
import PriorityBadge from "./PriorityBadge";
import { WORK_TYPES } from "../constants";


const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;

const workTypeLabel = (value) =>
  WORK_TYPES.find((option) => option.value === value)?.label ?? value;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
};

const itemCount = (items = []) => items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);


export default function VentaTable({
  ventas = [],
  onView,
}) {

  const columns = [
    { key: "folio", label: "Folio", render: (row) => <span className="font-bold text-text-primary">{row.folio || "—"}</span> },
    { key: "patientName", label: "Paciente", render: (row) => row.patientName || "Público general" },
    { key: "branchName", label: "Sucursal", render: (row) => row.branchName || "—" },
    { key: "sellerName", label: "Vendedor", render: (row) => row.sellerName || "—" },
    { key: "workType", label: "Trabajo", render: (row) => workTypeLabel(row.workType) },
    { key: "itemCount", label: "Cant. productos", render: (row) => itemCount(row.items) },
    { key: "total", label: "Total", render: (row) => <span className="font-bold text-text-primary">{currency(row.total)}</span> },
    { key: "createdAt", label: "Fecha y hora", render: (row) => formatDate(row.createdAt) },
    { key: "priority", label: "Prioridad", render: (row) => <PriorityBadge priority={row.priority} /> },
    {
      key: "status",
      label: "Estado",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "paymentStatus",
      label: "Pagos",
      render: (row) => <StatusBadge status={row.paymentStatus} />,
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
      data={ventas}
      emptyMessage="No hay ventas que coincidan con la búsqueda."
      pageSize={10}
      rowClassName={(row) => (row.priority === "urgente" ? "bg-[#FF6666]/5" : "")}
    />
  );

}
