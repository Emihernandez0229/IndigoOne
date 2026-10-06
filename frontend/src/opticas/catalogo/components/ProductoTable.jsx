import { Pencil, Ban, RotateCcw } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";
import { PRODUCT_CATEGORIES } from "../constants";


const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;

const categoryLabel = (value) =>
  PRODUCT_CATEGORIES.find((c) => c.value === value)?.label ?? value;


export default function ProductoTable({
  productos = [],
  canEdit = false,
  canDeactivate = false,
  onEdit,
  onDeactivate,
  onActivate,
}) {

  const columns = [
    { key: "displayId", label: "ID" },
    { key: "code", label: "Código" },
    { key: "name", label: "Nombre" },
    { key: "category", label: "Categoría", render: (row) => categoryLabel(row.category) },
    { key: "brand", label: "Marca" },
    { key: "salePrice", label: "Precio de venta", render: (row) => currency(row.salePrice) },
    { key: "cost", label: "Costo", render: (row) => currency(row.cost) },
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
    <DataTable columns={columns} data={productos} emptyMessage="No hay productos que coincidan con la búsqueda." />
  );

}
