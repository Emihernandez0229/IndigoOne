import { Pencil, Ban, RotateCcw } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";
import { USER_ROLE_LABELS } from "../constants";

export default function UserTable({
  users = [],
  canEdit = false,
  canDeactivate = false,
  onEdit,
  onDeactivate,
  onActivate,
}) {
  const columns = [
    {
      key: "displayId",
      label: "ID",
    },
    {
      key: "name",
      label: "Nombre",
    },
    {
      key: "username",
      label: "Usuario",
    },
    {
      key: "role",
      label: "Rol",
      render: (row) =>
        USER_ROLE_LABELS[row.role] ?? row.role,
    },
    {
      key: "branchName",
      label: "Sucursal",
    },
    {
      key: "status",
      label: "Estado",
      render: (row) => (
        <StatusBadge
          status={row.status}
          label={
            row.status === "active"
              ? "Activo"
              : "Inactivo"
          }
        />
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => (
        <div className="flex items-center gap-1">
          {canEdit && (
            <IconButton
              icon={Pencil}
              label="Editar"
              onClick={() => onEdit(row)}
            />
          )}

          {canDeactivate &&
            (row.status === "active" ? (
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
      data={users}
      emptyMessage="No hay usuarios que coincidan con la búsqueda."
    />
  );
}
