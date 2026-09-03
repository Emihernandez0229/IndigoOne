import { Eye, Pencil, Ban } from "lucide-react";

import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";


/**
 * Tabla de sucursales. Las acciones se muestran segun permisos (canEdit / canDeactivate).
 */
export default function BranchTable({
  branches = [],
  canEdit = false,
  canDeactivate = false,
  onView,
  onEdit,
  onDeactivate,
}) {

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Sucursal" },
    { key: "address", label: "Dirección" },
    { key: "manager", label: "Responsable" },
    { key: "phone", label: "Teléfono" },
    { key: "products", label: "Productos" },
    { key: "staff", label: "Personal" },
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
            <IconButton icon={Pencil} label="Editar" onClick={() => onEdit(row)} />
          )}

          {canDeactivate && row.status === "active" && (
            <IconButton
              icon={Ban}
              label="Dar de baja"
              variant="danger"
              onClick={() => onDeactivate(row)}
            />
          )}

        </div>
      ),
    },
  ];


  return (
    <DataTable
      columns={columns}
      data={branches}
      emptyMessage="No hay sucursales que coincidan con la búsqueda."
    />
  );

}
