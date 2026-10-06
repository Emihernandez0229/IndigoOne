import { Eye, Ban } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";
import { PAYMENT_METHODS } from "../constants";


const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;

const paymentLabel = (value) =>
  PAYMENT_METHODS.find((option) => option.value === value)?.label ?? value;

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


export default function VentaTable({
  ventas = [],
  canCancel = false,
  onView,
  onCancel,
}) {

  const columns = [
    { key: "displayId", label: "ID" },
    { key: "patientName", label: "Paciente", render: (row) => row.patientName || "Público general" },
    { key: "items", label: "Productos", render: (row) => summarizeItems(row.items) },
    {
      key: "paymentMethod",
      label: "Método de pago",
      render: (row) => paymentLabel(row.paymentMethod),
    },
    { key: "total", label: "Total", render: (row) => currency(row.total) },
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

          {canCancel && row.status === "completada" && (
            <IconButton
              icon={Ban}
              label="Cancelar venta"
              variant="danger"
              onClick={() => onCancel(row)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={ventas}
      emptyMessage="No hay ventas que coincidan con la búsqueda."
    />
  );

}
