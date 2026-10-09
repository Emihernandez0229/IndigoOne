import { Eye } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import IconButton from "../../../shared/components/IconButton";
import PriorityBadge from "../../laboratory/components/PriorityBadge";
import { SERVICE_TYPE_LABELS } from "../../laboratory/constants";
import BigStatusBadge from "./BigStatusBadge";


function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-MX", { day: "2-digit", month: "2-digit", hour: "numeric", minute: "2-digit" });
}


export default function LabJobTable({ jobs = [], onView }) {

  const columns = [
    { key: "folio", label: "Folio" },
    { key: "clientName", label: "Cliente (óptica)" },
    { key: "seller", label: "Vendedor" },
    { key: "entryAt", label: "Ingreso", render: (row) => formatDateTime(row.entryAt) },
    { key: "biselType", label: "Tipo de bisel" },
    { key: "quantity", label: "Cant." },
    { key: "serviceType", label: "Servicio", render: (row) => SERVICE_TYPE_LABELS[row.serviceType] ?? row.serviceType },
    { key: "requestedDeliveryAt", label: "Entrega", render: (row) => formatDateTime(row.requestedDeliveryAt) },
    { key: "priority", label: "Prioridad", render: (row) => <PriorityBadge urgent={row.urgent} /> },
    {
      key: "status",
      label: "Estado",
      render: (row) => <BigStatusBadge status={row.status} />,
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
      data={jobs}
      emptyMessage="No hay trabajos que coincidan con la búsqueda."
      pageSize={10}
      rowClassName={(row) => (row.urgent ? "bg-[#FF6666]/5" : "")}
    />
  );
}
