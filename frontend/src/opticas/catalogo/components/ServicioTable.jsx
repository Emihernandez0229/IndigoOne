import { Eye, Pencil, Ban, RotateCcw } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";
import { SERVICE_CATEGORIES } from "../constants";


const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;

const categoryLabel = (value) =>
  SERVICE_CATEGORIES.find((c) => c.value === value)?.label ?? value;


export default function ServicioTable({
  servicios = [],
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
    { key: "code", label: "SKU" },
    { key: "category", label: "Categoría", render: (row) => categoryLabel(row.category) },
    { key: "price", label: "Precio", render: (row) => currency(row.price) },
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
      data={servicios}
      emptyMessage="No hay servicios que coincidan con la búsqueda."
      headerTextClassName="text-indigo-primary"
      pageSize={10}
    />
  );

}
