import { useState } from "react";
import { ClipboardList, Clock, AlertTriangle } from "lucide-react";

import StatusBadge from "../../../shared/components/StatusBadge";
import TabBar from "../../../shared/components/TabBar";
import PriorityBadge from "./PriorityBadge";
import JobTimeline from "./JobTimeline";
import { SERVICE_TYPE_LABELS } from "../constants";


const TABS = [
  { value: "info", label: "Información general" },
  { value: "details", label: "Detalles" },
];


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
  if (!value) return null;
  return new Date(value).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}


function formatTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
}


export default function LaboratoryDetailPanel({ job }) {

  const [tab, setTab] = useState("info");

  if (!job) return null;

  const isLoss = job.status === "loss";

  const processingMinutes = job.completedAt && job.acceptedAt
    ? Math.round((new Date(job.completedAt) - new Date(job.acceptedAt)) / 60000)
    : null;

  const totalMinutes = (job.deliveredAt ?? job.completedAt) && job.entryAt
    ? Math.round((new Date(job.deliveredAt ?? job.completedAt) - new Date(job.entryAt)) / 60000)
    : null;

  const formatDuration = (minutes) => {
    if (minutes == null) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h} h ${m} min` : `${m} min`;
  };

  return (
    <div className="space-y-6">

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Trabajo {job.folio}</h2>
          {job.urgent && <p className="mt-1 text-sm font-semibold" style={{ color: "#FF6666" }}>Urgente</p>}
          <p className="mt-1 text-sm text-text-secondary">{formatDateTime(job.entryAt)}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "info" && (
        <div className="space-y-6">

          <div className="rounded-2xl border border-gray-200 bg-surface p-5">
            <SectionTitle icon={ClipboardList}>Datos del trabajo</SectionTitle>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Field label="Sucursal" value={job.branchName} />
              <Field label="Tipo de servicio" value={SERVICE_TYPE_LABELS[job.serviceType]} />
              <Field label="Cliente" value={job.clientName} />
              <Field label="Tipo de bisel" value={job.biselType} />
              <Field label="Vendedor" value={job.seller} />
              <Field label="Cantidad" value={job.quantity} />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Prioridad</dt>
                <dd className="mt-1"><PriorityBadge urgent={job.urgent} /></dd>
              </div>
              <Field label="Fecha de ingreso" value={formatDateTime(job.entryAt)} />
              <Field label="Responsable de laboratorio" value={job.labPerson} />
              <Field label="Hora de ingreso" value={formatTime(job.entryAt)} />
              <Field label="Aceptado por" value={job.acceptedBy} />
              <Field label="Hora de aceptación" value={formatTime(job.acceptedAt)} />
            </dl>
          </div>

          {isLoss && job.lossReason && (
            <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Merma registrada</p>
                <p>{job.lossReason}</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-surface p-5">
            <SectionTitle icon={Clock}>Línea de tiempo</SectionTitle>
            <JobTimeline job={job} />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-surface p-5">
            <SectionTitle icon={Clock}>Resumen</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-secondary">Tiempo total del trabajo</p>
                <p className="text-sm font-bold text-text-primary">{formatDuration(totalMinutes)}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Tiempo de procesamiento</p>
                <p className="text-sm font-bold text-text-primary">{formatDuration(processingMinutes)}</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {tab === "details" && (
        <div className="rounded-2xl border border-gray-200 bg-surface p-5">
          <SectionTitle icon={ClipboardList}>Lo que se hizo en laboratorio</SectionTitle>

          {(job.workItems ?? []).length === 0 ? (
            <p className="text-sm text-text-secondary">Aún no hay detalles registrados para este trabajo.</p>
          ) : (
            <ol className="space-y-3">
              {job.workItems.map((item, index) => (
                <li key={index} className="flex gap-3 rounded-xl bg-background px-4 py-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-light text-xs font-bold text-indigo-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm text-text-primary">{item.text ?? item}</p>
                    {(item.author || item.at) && (
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {[item.author, formatDateTime(item.at)].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

    </div>
  );

}
