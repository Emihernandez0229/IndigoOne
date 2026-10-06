import { Eye, Pencil, Ban, RotateCcw } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";


const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-MX");
};


export default function PatientTable({
  patients = [],
  canEdit = false,
  canDeactivate = false,
  onView,
  onEdit,
  onDeactivate,
  onActivate,
}) {

  const columns = [
    { key: "displayId", label: "ID" },
    { key: "name", label: "Nombre" },
    { key: "phone", label: "Teléfono", render: (row) => row.phone || "—" },
    { key: "email", label: "Email", render: (row) => row.email || "—" },
    {
      key: "birthDate",
      label: "Fecha de nacimiento",
      render: (row) => formatDate(row.birthDate),
    },
    {
      key: "createdAt",
      label: "Fecha de registro",
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "status",
      label: "Estado",
      render: (row) => (
        <StatusBadge
          status={row.active ? "active" : "inactive"}
          label={row.active ? "Activo" : "Inactivo"}
        />
      ),
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
              onClick={() => onEdit(row)}
            />
          )}

          {canDeactivate &&
            (row.active ? (
              <IconButton
                icon={Ban}
                label="Dar de baja"
                variant="danger"
                onClick={() => onDeactivate(row)}
              />
            ) : (
              <IconButton
                icon={RotateCcw}
                label="Dar de alta"
                onClick={() => onActivate(row)}
              />
            ))}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={patients}
      emptyMessage="No hay pacientes que coincidan con la búsqueda."
    />
  );

}
