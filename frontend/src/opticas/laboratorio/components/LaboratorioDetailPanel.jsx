import { Info, RefreshCcw, Eye } from "lucide-react";
import { Link } from "react-router-dom";

import StatusBadge from "../../../shared/components/StatusBadge";
import Button from "../../../shared/components/Button";
import SectionTitle from "../../../shared/components/SectionTitle";
import Field from "../../../shared/components/DetailField";
import PriorityBadge from "../../ventas/components/PriorityBadge";
import { STATUS_TRANSITIONS } from "../constants";
import { LAB_WORK_SUBTYPES } from "../../ventas/constants";


const subtypeLabel = (value) =>
  LAB_WORK_SUBTYPES.find((option) => option.value === value)?.label ?? value;

const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;


function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" });
}


/**
 * Detalle de orden de laboratorio para el Dueño de óptica - mismo patrón
 * visual que los demás paneles de "ver" ya hechos, con el cambio de
 * estado y la graduación incluidos.
 */
export default function LaboratorioDetailPanel({ order, patient, canManage = false, onChangeStatus }) {

  if (!order) return null;

  const transitions = STATUS_TRANSITIONS[order.status] ?? [];
  const receta = order.receta ?? {};

  return (
    <div className="space-y-6">

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-light text-lg font-bold text-indigo-primary">
          {(patient?.name || "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">{patient?.name ?? "Orden de laboratorio"}</h2>
          <p className="text-sm text-text-secondary">{order.folio ? `Venta ${order.folio} · ` : ""}{formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-surface p-5">
        <SectionTitle icon={Info}>Datos de la orden</SectionTitle>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={order.status} />
          <PriorityBadge priority={order.priority} />
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="col-span-2">
            <Field label="Paciente" value={patient?.name} />
          </div>
          <div className="col-span-2">
            <Field label="Producto" value={order.items.map((item) => item.model || item.code).join(", ")} />
          </div>
          {order.workSubtype && (
            <div className="col-span-2">
              <Field label="Tipo de trabajo solicitado" value={subtypeLabel(order.workSubtype)} />
            </div>
          )}
          <Field label="Vendedor" value={order.sellerName} />
          <Field label="Sucursal" value={order.branchName} />
          <Field label="Total" value={currency(order.total)} />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Pagos</dt>
            <dd className="mt-1">{order.paymentStatus ? <StatusBadge status={order.paymentStatus} /> : "—"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Venta relacionada</dt>
            <dd className="mt-1 text-sm font-bold text-text-primary">
              {order.saleId ? (
                <Link to="/opticas/ventas" state={{ viewVentaId: order.saleId }} className="inline-flex items-center gap-1 text-indigo-primary hover:underline">
                  <Eye className="h-3.5 w-3.5" />
                  Ver venta
                </Link>
              ) : "—"}
            </dd>
          </div>
        </dl>

        {order.notes && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="mb-1 text-sm font-medium text-text-secondary">Observaciones</p>
            <p className="text-sm text-text-primary">{order.notes}</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-surface p-5">
        <SectionTitle icon={Info}>Graduación</SectionTitle>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-text-primary">Ojo derecho (OD)</p>
            <dl className="grid grid-cols-3 gap-2">
              <Field label="Esfera" value={receta.odEsfera} />
              <Field label="Cilindro" value={receta.odCilindro} />
              <Field label="Eje" value={receta.odEje} />
            </dl>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-text-primary">Ojo izquierdo (OI)</p>
            <dl className="grid grid-cols-3 gap-2">
              <Field label="Esfera" value={receta.oiEsfera} />
              <Field label="Cilindro" value={receta.oiCilindro} />
              <Field label="Eje" value={receta.oiEje} />
            </dl>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          <Field label="Adición" value={receta.adicion} />
          <Field label="Distancia pupilar (DP)" value={receta.dp} />
        </dl>
      </div>

      {canManage && transitions.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-surface p-5">
          <SectionTitle icon={RefreshCcw}>Cambiar estado</SectionTitle>
          <div className="space-y-3">
            {transitions.map((transition) => (
              <Button
                key={transition.value}
                type="button"
                variant={transition.variant}
                className="w-full"
                onClick={() => onChangeStatus(transition)}
              >
                {transition.label}
              </Button>
            ))}
          </div>
        </div>
      )}

    </div>
  );

}
