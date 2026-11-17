import { Eye, Pencil, Ban, RotateCcw } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";
import { USER_ROLE_LABELS } from "../constants";


/**
 * Tabla de personal, compartida por los 3 listados de Indigo:
 *  - Super usuario ("Personal"): todas las sucursales, con editar y dar de
 *    baja a cualquiera (`canEdit`, `canDeactivate`, columna de sucursal).
 *  - Gerente/Subgerente ("Empleados"): mismo editar/dar de baja, pero sin
 *    columna de sucursal (`showBranchColumn={false}`, siempre es la suya).
 *  - Dueño/Super usuario ("Usuarios", de solo lectura): sin editar, y dar
 *    de baja solo aplica a cuentas de Gerente (`restrictDeactivateToRole`).
 */
export default function UserTable({
  users = [],
  showBranchColumn = true,
  canEdit = false,
  canDeactivate = false,
  restrictDeactivateToRole = null,
  onView,
  onEdit,
  onDeactivate,
  onActivate,
}) {

  const columns = [
    { key: "displayId", label: "ID" },
    { key: "name", label: "Nombre" },
    { key: "username", label: "Usuario" },
    { key: "role", label: "Rol", render: (row) => USER_ROLE_LABELS[row.role] ?? row.role },
    ...(showBranchColumn
      ? [{ key: "branchName", label: "Sucursal", render: (row) => row.branchName || "Sin sucursal" }]
      : []),
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
      render: (row) => {
        const deactivateAllowed =
          canDeactivate && (!restrictDeactivateToRole || row.role === restrictDeactivateToRole);

        return (
          <div className="flex items-center gap-1">
            <IconButton icon={Eye} label="Ver" onClick={() => onView(row)} />

            {canEdit && (
              <IconButton icon={Pencil} label="Editar" onClick={() => onEdit(row)} />
            )}

            {deactivateAllowed &&
              (row.status === "active" ? (
                <IconButton icon={Ban} label="Dar de baja" variant="danger" onClick={() => onDeactivate(row)} />
              ) : (
                <IconButton icon={RotateCcw} label="Dar de alta" onClick={() => onActivate(row)} />
              ))}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      emptyMessage="No hay personal que coincida con la búsqueda."
      pageSize={10}
    />
  );
}
