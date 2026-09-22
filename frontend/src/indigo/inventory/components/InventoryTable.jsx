import { Eye, Pencil, Ban, RotateCcw } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";
import { getStockStatus } from "../stockStatus";
import { PRODUCT_TYPES } from "../constants";


const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;

const typeLabel = (value) =>
  PRODUCT_TYPES.find((option) => option.value === value)?.label ?? value;


export default function InventoryTable({
  items = [],
  canEdit = false,
  canDeactivate = false,
  onView,
  onEdit,
  onDeactivate,
  onActivate,
}) {

  const columns = [
    { key: "displayId", label: "ID" },
    { key: "code", label: "Código" },
    { key: "model", label: "Modelo" },
    { key: "color", label: "Color" },
    {
      key: "type",
      label: "Tipo",
      render: (row) => typeLabel(row.type),
    },
    {
      key: "material",
      label: "Material",
      render: (row) => row.materialLabel ?? row.material,
    },
    { key: "branchName", label: "Sucursal" },
    { key: "stockAvailable", label: "Stock disponible" },
    { key: "stockMin", label: "Stock mínimo" },
    {
      key: "cost",
      label: "Costo",
      render: (row) => currency(row.cost),
    },
    {
      key: "status",
      label: "Estado",
      render: (row) => <StatusBadge status={getStockStatus(row)} />,
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
      data={items}
      emptyMessage="No hay productos que coincidan con la búsqueda."
    />
  );

}
