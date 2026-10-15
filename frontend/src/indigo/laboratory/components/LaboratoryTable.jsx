import { Eye } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";
import PriorityBadge from "./PriorityBadge";
import { SERVICE_TYPE_LABELS } from "../constants";


function formatEntry(job) {
  const date = new Date(job.entryAt);
  return date.toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit" });
}


export default function LaboratoryTable({ jobs = [], onView }) {

  const columns = [
    { key: "folio", label: "Folio" },
    { key: "entryAt", label: "Fecha y hora de ingreso", render: formatEntry },
    { key: "branchName", label: "Sucursal" },
    { key: "clientName", label: "Cliente" },
    { key: "seller", label: "Vendedor" },
    { key: "serviceType", label: "Servicio", render: (row) => SERVICE_TYPE_LABELS[row.serviceType] ?? row.serviceType },
    { key: "quantity", label: "Cantidad" },
    { key: "priority", label: "Prioridad", render: (row) => <PriorityBadge urgent={row.urgent} /> },
    { key: "labPerson", label: "Laboratorio" },
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
      data={jobs}
      emptyMessage="No hay trabajos de laboratorio que coincidan con la búsqueda."
      pageSize={10}
      rowClassName={(row) => (row.urgent ? "bg-[#FF6666]/5" : "")}
    />
  );
}
