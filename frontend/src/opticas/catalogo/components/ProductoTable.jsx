import { Eye, Pencil, Ban, RotateCcw, ImageOff } from "lucide-react";
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
  onView,
  onEdit,
  onDeactivate,
  onActivate,
}) {

  const columns = [
    { key: "displayId", label: "ID" },
    {
      key: "imageUrl",
      label: "Imagen",
      render: (row) => (
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-background">
          {row.imageUrl ? (
            <img src={row.imageUrl} alt={row.name} className="h-full w-full object-cover" />
          ) : (
            <ImageOff className="h-4 w-4 text-text-secondary" />
          )}
        </div>
      ),
    },
    { key: "name", label: "Nombre", render: (row) => <span className="font-bold text-text-primary">{row.name}</span> },
    { key: "code", label: "SKU / Código interno" },
    { key: "category", label: "Categoría", render: (row) => categoryLabel(row.category) },
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
