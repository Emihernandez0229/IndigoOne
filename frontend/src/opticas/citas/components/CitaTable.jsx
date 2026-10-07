import { Eye, Pencil } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";
import { EDITABLE_STATUSES } from "../constants";


const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};


export default function CitaTable({
  citas = [],
  canEdit = false,
  onView,
  onEdit,
}) {

  const columns = [
    { key: "displayId", label: "ID" },
    { key: "patientName", label: "Paciente", render: (row) => row.patientName || "—" },
    {
      key: "dateTime",
      label: "Fecha y hora",
      render: (row) => formatDateTime(row.dateTime),
    },
    { key: "reason", label: "Motivo", render: (row) => row.reason || "—" },
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

          {canEdit && (
            <IconButton
              icon={Pencil}
              label="Editar"
              disabled={!EDITABLE_STATUSES.includes(row.status)}
              onClick={() => onEdit(row)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={citas}
      emptyMessage="No hay citas que coincidan con la búsqueda."
    />
  );

}
