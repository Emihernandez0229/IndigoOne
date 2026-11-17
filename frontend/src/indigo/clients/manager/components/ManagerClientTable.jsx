import { Eye, Pencil, Ban, RotateCcw } from "lucide-react";
import DataTable from "../../../../shared/components/DataTable";
import StatusBadge from "../../../../shared/components/StatusBadge";
import IconButton from "../../../../shared/components/IconButton";


export default function ManagerClientTable({ clients = [], canEdit = true, canDeactivate = true, onView, onEdit, onDeactivate, onActivate }) {

  const columns = [
    { key: "displayId", label: "ID" },
    { key: "code", label: "Código" },
    { key: "name", label: "Cliente" },
    { key: "rfc", label: "RFC", render: (row) => row.rfc || "—" },
    { key: "phone", label: "Teléfono", render: (row) => row.phone || "—" },
    {
      key: "status",
      label: "Estado",
      render: (row) => (
        <StatusBadge status={row.status} label={row.status === "active" ? "Activo" : "Inactivo"} />
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => (
        <div className="flex items-center gap-1">
          <IconButton icon={Eye} label="Ver" onClick={() => onView(row)} />

          {canEdit && (
            <IconButton icon={Pencil} label="Editar" onClick={() => onEdit(row)} />
          )}

          {canDeactivate &&
            (row.status === "active" ? (
              <IconButton icon={Ban} label="Dar de baja" variant="danger" onClick={() => onDeactivate(row)} />
            ) : (
              <IconButton icon={RotateCcw} label="Dar de alta" onClick={() => onActivate(row)} />
            ))}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={clients}
      emptyMessage="No hay clientes que coincidan con la búsqueda."
      pageSize={10}
    />
  );
}
