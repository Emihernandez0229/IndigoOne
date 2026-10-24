import { Info, RefreshCcw } from "lucide-react";

import StatusBadge from "../../../shared/components/StatusBadge";
import Button from "../../../shared/components/Button";
import { STATUS_TRANSITIONS } from "../constants";


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


function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" });
}


/**
 * Detalle de cita para el Dueño de óptica - mismo patrón visual que los
 * demás paneles de "ver" ya hechos. Incluye el cambio de estado (igual
 * que CitaDetailPage), pero sin opción de cancelación por separado: las
 * transiciones ya vienen definidas por STATUS_TRANSITIONS, igual que antes.
 */
export default function CitaDetailPanel({ cita, patient, canManage = false, onChangeStatus }) {

  if (!cita) return null;

  const transitions = STATUS_TRANSITIONS[cita.status] ?? [];

  return (
    <div className="space-y-6">

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-light text-lg font-bold text-indigo-primary">
          {(patient?.name || "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">{patient?.name ?? "Cita"}</h2>
          <StatusBadge status={cita.status} />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-surface p-5">
        <SectionTitle icon={Info}>Datos de la cita</SectionTitle>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="col-span-2">
            <Field label="Paciente" value={patient?.name} />
          </div>
          <Field label="Teléfono" value={patient?.phone} />
          <Field label="Fecha y hora" value={formatDateTime(cita.dateTime)} />
          <div className="col-span-2">
            <Field label="Motivo" value={cita.reason} />
          </div>
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
