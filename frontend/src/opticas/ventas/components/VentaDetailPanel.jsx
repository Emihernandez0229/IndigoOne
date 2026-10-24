import { useState } from "react";
import { ClipboardList, Clock, AlertTriangle, XCircle, DollarSign, Info } from "lucide-react";

import StatusBadge from "../../../shared/components/StatusBadge";
import Button from "../../../shared/components/Button";
import TabBar from "../../../shared/components/TabBar";
import PriorityBadge from "./PriorityBadge";
import VentaTimeline from "./VentaTimeline";
import GraduacionSummary from "./GraduacionSummary";
import { PAYMENT_METHODS, WORK_TYPE_INFO, STATUS_TRANSITIONS } from "../constants";


const TABS = [
  { value: "info", label: "Información general" },
  { value: "details", label: "Detalles" },
];

const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;

const paymentLabel = (value) =>
  PAYMENT_METHODS.find((option) => option.value === value)?.label ?? value;

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" });
};


function SectionTitle({ icon: Icon, children }) {
  return (
    <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-text-primary">
      <Icon className="h-4 w-4 text-indigo-primary" />
      {children}
    </h3>
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


/**
 * Detalle de una venta - mismo patron que LaboratoryDetailPanel de Indigo
 * (Dueño): tabs "Información general"/"Detalles", tarjeta de datos y
 * linea de tiempo. "Estado" (trabajo) y "Pagos" son independientes.
 *
 * `receta` (opcional) es la graduacion de la orden de laboratorio ligada
 * a esta venta - solo aplica cuando workType es "orden_laboratorio".
 */
export default function VentaDetailPanel({ venta, receta, onLiquidar, onChangeStatus, onCancel }) {

  const [tab, setTab] = useState("info");

  if (!venta) return null;

  const transitions = STATUS_TRANSITIONS[venta.status] ?? [];
  const canCancel = venta.status === "pendiente";
  const hasSaldo = venta.saldoPendiente > 0;

  return (
    <div className="space-y-6">

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-light text-lg font-bold text-indigo-primary">
            {(venta.patientName || "?").charAt(0).toUpperCase()}
          </span>
          <div>
            <h2 className="text-xl font-bold text-text-primary">{venta.patientName || "Público general"}</h2>
            <p className="text-sm text-text-secondary">Venta {venta.folio} · {formatDateTime(venta.createdAt)}</p>
          </div>
        </div>
        <StatusBadge status={venta.status} />
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "info" && (
        <div className="space-y-6">

          <div className="rounded-2xl border border-gray-200 bg-surface p-5">
            <SectionTitle icon={ClipboardList}>Datos de la venta</SectionTitle>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-text-primary">
                {WORK_TYPE_INFO[venta.workType]?.label ?? venta.workType}
              </span>
              <PriorityBadge priority={venta.priority} />
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Field label="Vendedor" value={venta.sellerName} />
              <Field label="Sucursal" value={venta.branchName} />
              <Field label="Método de pago" value={paymentLabel(venta.paymentMethod)} />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Pagos</dt>
                <dd className="mt-1"><StatusBadge status={venta.paymentStatus} /></dd>
              </div>
              {hasSaldo ? (
                <>
                  <Field label="Total" value={currency(venta.total)} />
                  <Field label="Adeudo" value={currency(venta.saldoPendiente)} />
                </>
              ) : (
                <Field label="Monto de pago" value={currency(venta.montoPagado)} />
              )}
            </dl>

            {hasSaldo && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Saldo pendiente</p>
                  <p className="text-lg font-bold text-text-primary">{currency(venta.saldoPendiente)}</p>
                </div>
                {onLiquidar && (
                  <Button className="gap-2" onClick={() => onLiquidar(venta)}>
                    <DollarSign className="h-4 w-4" />
                    Liquidar saldo
                  </Button>
                )}
              </div>
            )}
          </div>

          {venta.status === "cancelada" && (
            <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Venta cancelada</p>
                <p>{formatDateTime(venta.cancelledAt)}</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-surface p-5">
            <SectionTitle icon={Clock}>Línea de tiempo</SectionTitle>
            <VentaTimeline venta={venta} />
          </div>

        </div>
      )}

      {tab === "details" && (
        <div className="space-y-6">

          <div className="rounded-2xl border border-gray-200 bg-surface p-5">
            <SectionTitle icon={ClipboardList}>Productos y servicios</SectionTitle>

            <div className="space-y-3">
              {venta.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl bg-background px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">{item.model}</p>
                    <p className="text-xs text-text-secondary">{item.code} · Cant. {item.quantity}</p>
                  </div>
                  <span className="shrink-0 font-semibold text-text-primary">
                    {currency(item.quantity * item.unitPrice)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>{currency(venta.subtotal)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>IVA</span>
                <span>{currency(venta.iva)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-1 text-base font-bold text-text-primary">
                <span>Total</span>
                <span>{currency(venta.total)}</span>
              </div>
            </div>
          </div>

          {venta.workType === "orden_laboratorio" && receta && (
            <div className="rounded-2xl border border-gray-200 bg-surface p-5">
              <SectionTitle icon={Info}>Graduación</SectionTitle>
              <GraduacionSummary receta={receta} />
            </div>
          )}

        </div>
      )}

      {(transitions.length > 0 || canCancel) && (
        <div className="flex flex-col gap-2">
          {transitions.map((transition) => (
            <Button
              key={transition.value}
              className="w-full justify-center"
              onClick={() => onChangeStatus(venta, transition)}
            >
              {transition.label}
            </Button>
          ))}
          {canCancel && (
            <Button variant="danger" className="w-full justify-center gap-2" onClick={() => onCancel(venta)}>
              <XCircle className="h-4 w-4" />
              Cancelar venta
            </Button>
          )}
        </div>
      )}

    </div>
  );

}
