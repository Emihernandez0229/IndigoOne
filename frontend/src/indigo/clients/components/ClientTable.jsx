import { Eye, Pencil, Ban, RotateCcw } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";


/**
 * Tabla de clientes, en 2 variantes:
 *  - "global" (Super usuario/Dueño, de solo lectura): columnas fiscales
 *    (tipo, RFC, correo) y cuántas sucursales tiene el cliente - sin
 *    acciones de editar/dar de baja.
 *  - "branch" (Gerente/Subgerente, acotado a su sucursal): código y razón
 *    social en vez de las columnas fiscales, con editar/dar de baja según
 *    `canEdit`/`canDeactivate`.
 */
export default function ClientTable({
  clients = [],
  variant = "global",
  canEdit = false,
  canDeactivate = false,
  onView,
  onEdit,
  onDeactivate,
  onActivate,
}) {

  const isBranch = variant === "branch";

  const columns = [
    { key: "id", label: "ID", render: (row) => isBranch ? row.displayId : row.code },
    { key: "name", label: isBranch ? "Nombre del cliente" : "Cliente" },
    ...(isBranch
      ? [{ key: "code", label: "Código" }, { key: "businessName", label: "Razón social" }]
      : [{ key: "type", label: "Tipo" }, { key: "rfc", label: "RFC" }]),
    { key: "phone", label: "Teléfono" },
    ...(isBranch ? [] : [{ key: "email", label: "Correo" }]),
    {
      key: "status",
      label: "Estado",
      render: (row) => (
        <StatusBadge status={row.status} label={row.status === "active" ? "Activo" : "Inactivo"} />
      ),
    },
    ...(isBranch ? [] : [{ key: "branches", label: "Sucursales", render: (row) => (row.branches ?? []).length }]),
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
