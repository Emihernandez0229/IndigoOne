import { Pencil, Ban, RotateCcw } from "lucide-react";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import Can from "../../../shared/security/Can";
import { SERVICE_CATEGORIES } from "../constants";


const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;

const categoryLabel = (value) =>
  SERVICE_CATEGORIES.find((c) => c.value === value)?.label ?? value;


export default function ServicioDetailPanel({ servicio, canDeactivate = false, onEdit, onDeactivate, onActivate }) {

  if (!servicio) return null;

  return (
    <div className="space-y-4">

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={servicio.active ? "active" : "inactive"} label={servicio.active ? "Activo" : "Inactivo"} />
        <span className="rounded-full bg-indigo-light px-2.5 py-1 text-xs font-medium text-indigo-primary">Servicio</span>
      </div>

      <h3 className="text-lg font-bold text-text-primary">{servicio.name}</h3>

      <div>
        <p className="text-xs text-text-secondary">Precio</p>
        <p className="text-2xl font-bold text-text-primary">{currency(servicio.price)}</p>
      </div>

      <dl className="space-y-3 border-t border-gray-100 pt-4">
        <Field label="SKU" value={servicio.code} />
        <Field label="Categoría" value={categoryLabel(servicio.category)} />
        <Field label="Descripción" value={servicio.description} />
      </dl>

      <div className="flex gap-2">
        <Can permission="optica.catalog.update">
          <Button className="flex-1 justify-center gap-2" onClick={() => onEdit(servicio)}>
            <Pencil className="h-4 w-4" />
            Editar servicio
          </Button>
        </Can>

        {canDeactivate && (servicio.active ? (
          <Button variant="danger" className="flex-1 justify-center gap-2" onClick={() => onDeactivate(servicio)}>
            <Ban className="h-4 w-4" />
            Dar de baja
          </Button>
        ) : (
          <Button variant="outline" className="flex-1 justify-center gap-2" onClick={() => onActivate(servicio)}>
            <RotateCcw className="h-4 w-4" />
            Dar de alta
          </Button>
        ))}
      </div>

    </div>
  );

}


function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-text-primary">{value || "—"}</dd>
    </div>
  );
}
