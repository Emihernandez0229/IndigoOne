import { Eye, Pencil, Ban, RotateCcw } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";
import { currency } from "../../../shared/utils/format";


export default function ProductoTable({
  productos = [],
  canEdit = false,
  canDeactivate = false,
  onView,
  onEdit,
  onDeactivate,
  onActivate,
}) {

  const columns = [
    { key: "displayId", label: "ID" },
    { key: "name", label: "Nombre", render: (row) => <span className="font-bold text-text-primary">{row.name}</span> },
    { key: "code", label: "SKU / Código interno" },
    { key: "categoryName", label: "Categoría" },
    { key: "brand", label: "Marca" },
    { key: "salePrice", label: "Precio de venta", render: (row) => <span className="font-bold text-text-primary">{currency(row.salePrice)}</span> },
    { key: "stockMin", label: "Stock mínimo", render: (row) => row.stockMin ?? 0 },
    { key: "branchStock", label: "Stock en sucursal", render: (row) => row.branchStock ?? 0 },
    {
      key: "status",
      label: "Estado",
      render: (row) => <StatusBadge status={row.active ? "active" : "inactive"} label={row.active ? "Activo" : "Inactivo"} />,
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => (
        <div className="flex items-center gap-1">
          <IconButton icon={Eye} label="Ver" onClick={() => onView(row)} />
          {canEdit && <IconButton icon={Pencil} label="Editar" onClick={() => onEdit(row)} />}
          {canDeactivate && (row.active ? (
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
      data={productos}
      emptyMessage="No hay productos que coincidan con la búsqueda."
      headerTextClassName="text-indigo-primary"
      pageSize={10}
    />
  );

}
