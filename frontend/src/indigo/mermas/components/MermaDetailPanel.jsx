import { AlertTriangle, ClipboardList, Users, Clock } from "lucide-react";

import PriorityBadge from "../../laboratory/components/PriorityBadge";
import { SERVICE_TYPE_LABELS } from "../../laboratory/constants";


function SectionTitle({ icon: Icon, children, tone = "indigo" }) {
  return (
    <h3 className={`mb-4 flex items-center gap-2 text-base font-bold ${tone === "danger" ? "" : "text-text-primary"}`} style={tone === "danger" ? { color: "#FF6666" } : undefined}>
      <Icon className={`h-4 w-4 ${tone === "indigo" ? "text-indigo-primary" : ""}`} style={tone === "danger" ? { color: "#FF6666" } : undefined} />
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
  if (!value) return null;
  return new Date(value).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}


function formatTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
}


function Timeline({ merma }) {
  const steps = [
    { label: "Trabajo ingresado", time: merma.entryAt, person: merma.seller, color: "#22A06B" },
    { label: "Aceptado por laboratorio", time: merma.acceptedAt, person: merma.acceptedBy, color: "#22A06B" },
    { label: "En proceso", time: merma.processingAt, person: null, color: "#5565C8" },
    { label: "Merma registrada", time: merma.lossAt, person: merma.acceptedBy ?? merma.labPerson, color: "#FF6666" },
  ];

  return (
    <div className="space-y-5">
      {steps.map((step, index) => {
        const done = Boolean(step.time);
        const isLast = index === steps.length - 1;

        return (
          <div key={step.label} className="relative flex gap-3 pb-1">
            {!isLast && (
              <span className="absolute left-[11px] top-6 h-full w-0.5 bg-gray-200" />
            )}

            <span
              className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: done ? step.color : "#E5E7EB" }}
            />

            <div>
              <p className={`text-sm font-medium ${done ? "text-text-primary" : "text-text-secondary"}`}>{step.label}</p>
              <p className="text-xs text-text-secondary">
                {formatDateTime(step.time) ?? "--:--"}{done && step.person ? ` · ${step.person}` : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}


export default function MermaDetailPanel({ merma }) {

  if (!merma) return null;

  const minutesToLoss = merma.lossAt && merma.entryAt
    ? Math.round((new Date(merma.lossAt) - new Date(merma.entryAt)) / 60000)
    : null;

  const formatDuration = (minutes) => {
    if (minutes == null) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h} h ${m} min` : `${m} min`;
  };

  return (
    <div className="space-y-6">

      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "#FF666626" }}>
          <AlertTriangle className="h-6 w-6" style={{ color: "#FF6666" }} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Trabajo {merma.folio}</h2>
          <span className="mt-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: "#FF666626", color: "#FF6666" }}>
            Merma
          </span>
          <p className="mt-1 text-sm text-text-secondary">Registrada el {formatDateTime(merma.lossAt)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-surface p-5">
        <SectionTitle icon={ClipboardList}>Datos del trabajo</SectionTitle>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <Field label="Sucursal" value={merma.branchName} />
          <Field label="Tipo de bisel" value={merma.biselType} />
          <Field label="Cliente" value={merma.clientName} />
          <Field label="Cantidad" value={merma.quantity} />
          <Field label="Vendedor" value={merma.seller} />
          <Field label="Servicio" value={SERVICE_TYPE_LABELS[merma.serviceType]} />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Prioridad</dt>
            <dd className="mt-1"><PriorityBadge urgent={merma.urgent} /></dd>
          </div>
          <div />
          <Field label="Fecha de ingreso" value={formatDateTime(merma.entryAt)} />
          <Field label="Hora de ingreso" value={formatTime(merma.entryAt)} />
        </dl>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-surface p-5">
        <SectionTitle icon={Users}>Responsables</SectionTitle>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <Field label="Aceptó el trabajo" value={merma.acceptedBy} />
          <Field label="Hora de aceptación" value={formatDateTime(merma.acceptedAt)} />
          <Field label="Realizó el trabajo" value={merma.labPerson} />
          <Field label="Rol" value="Laboratorio" />
        </dl>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-surface p-5">
        <SectionTitle icon={Clock}>Línea de tiempo</SectionTitle>
        <Timeline merma={merma} />
      </div>

      {merma.lossReason && (
        <div className="rounded-2xl border p-5" style={{ borderColor: "#FF666655", backgroundColor: "#FF666612" }}>
          <SectionTitle icon={AlertTriangle} tone="danger">Explicación de lo sucedido</SectionTitle>
          <p className="text-sm text-text-primary">{merma.lossReason}</p>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-surface p-5">
        <SectionTitle icon={Clock}>Tiempo hasta la merma</SectionTitle>
        <p className="text-sm font-bold text-text-primary">{formatDuration(minutesToLoss)}</p>
      </div>

    </div>
  );

}
