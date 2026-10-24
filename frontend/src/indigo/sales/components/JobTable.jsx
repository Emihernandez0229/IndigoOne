import { Eye } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";
import PriorityBadge from "../../laboratory/components/PriorityBadge";
import { LAB_STATUS_LABELS, SERVICE_TYPE_LABELS } from "../../laboratory/constants";


function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-MX", { day: "2-digit", month: "2-digit", hour: "numeric", minute: "2-digit" });
}


export default function JobTable({ jobs = [], onView }) {

  const columns = [
    { key: "folio", label: "Folio" },
    { key: "clientName", label: "Cliente (óptica)" },
    {
      key: "seller",
      label: "Vendedor",
      render: (row) => (
        <div>
          <p className="text-text-primary">{row.seller}</p>
          {row.registeredBy && row.registeredBy !== row.seller && (
            <p className="text-xs text-text-secondary">Registró: {row.registeredBy}</p>
          )}
        </div>
      ),
    },
    { key: "entryAt", label: "Ingreso", render: (row) => formatDateTime(row.entryAt) },
    { key: "serviceType", label: "Servicio", render: (row) => SERVICE_TYPE_LABELS[row.serviceType] ?? row.serviceType },
    { key: "biselType", label: "Tipo de bisel" },
    { key: "quantity", label: "Cant." },
    { key: "priority", label: "Prioridad", render: (row) => <PriorityBadge urgent={row.urgent} /> },
    { key: "requestedDeliveryAt", label: "Entrega", render: (row) => formatDateTime(row.requestedDeliveryAt) },
    {
      key: "status",
      label: "Estado",
      render: (row) => <StatusBadge status={row.status} label={LAB_STATUS_LABELS[row.status]} />,
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => (
        <div className="flex items-center gap-1">
          <IconButton icon={Eye} label="Ver seguimiento" onClick={() => onView(row)} />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={jobs}
      emptyMessage="No has registrado trabajos todavía."
      pageSize={10}
      rowClassName={(row) => (row.urgent ? "bg-[#FF6666]/5" : "")}
    />
  );
}
