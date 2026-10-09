import { useState } from "react";
import { ClipboardList, Clock, AlertTriangle, CheckCircle2, ListPlus } from "lucide-react";

import PriorityBadge from "../../laboratory/components/PriorityBadge";
import JobTimeline from "../../laboratory/components/JobTimeline";
import { SERVICE_TYPE_LABELS } from "../../laboratory/constants";
import BigStatusBadge from "./BigStatusBadge";


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


export default function LabJobDetailPanel({
  job,
  canAccept = false,
  canUpdate = false,
  onAccept,
  onComplete,
  onRegisterLoss,
  onAddDetail,
}) {

  const [lossMode, setLossMode] = useState(false);
  const [lossReason, setLossReason] = useState("");
  const [detailText, setDetailText] = useState("");
  const [saving, setSaving] = useState(false);

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

  const handleAccept = async () => {
    setSaving(true);
    try { await onAccept?.(job); } finally { setSaving(false); }
  };

  const handleComplete = async () => {
    setSaving(true);
    try { await onComplete?.(job); } finally { setSaving(false); }
  };

  const handleConfirmLoss = async () => {
    if (!lossReason.trim()) return;
    setSaving(true);
    try {
      await onRegisterLoss?.(job, lossReason.trim());
      setLossMode(false);
      setLossReason("");
    } finally {
      setSaving(false);
    }
  };

  const handleAddDetail = async () => {
    if (!detailText.trim()) return;
    setSaving(true);
    try {
      await onAddDetail?.(job, detailText.trim());
      setDetailText("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Trabajo {job.folio}</h2>
          {job.urgent && <p className="mt-1 text-sm font-semibold" style={{ color: "#FF6666" }}>Urgente</p>}
          <p className="mt-1 text-sm text-text-secondary">{formatDateTime(job.entryAt)}</p>
        </div>
        <BigStatusBadge status={job.status} />
      </div>

      {canAccept && job.status === "pending" && (
        <button
          type="button"
          disabled={saving}
          onClick={handleAccept}
          className="w-full rounded-xl bg-indigo-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-dark disabled:opacity-50"
        >
          Aceptar
        </button>
      )}

      {canUpdate && job.status === "processing" && !lossMode && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={handleComplete}
            className="flex items-center justify-center gap-2 rounded-xl bg-success px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Marcar terminado
          </button>
          <button
            type="button"
            onClick={() => setLossMode(true)}
            className="flex items-center justify-center gap-2 rounded-xl border-2 text-sm font-semibold transition hover:bg-background"
            style={{ borderColor: "#FF6666", color: "#FF6666" }}
          >
            <AlertTriangle className="h-4 w-4" />
            Merma
          </button>
        </div>
      )}

      {canUpdate && lossMode && (
        <div className="space-y-3 rounded-xl border p-4" style={{ borderColor: "#FF666655", backgroundColor: "#FF666612" }}>
          <p className="text-sm font-semibold" style={{ color: "#FF6666" }}>Explica qué sucedió (obligatorio)</p>
          <textarea
            value={lossReason}
            onChange={(e) => setLossReason(e.target.value)}
            rows={3}
            placeholder="Ej. El lente se rompió durante el proceso de biselado."
            className="w-full rounded-xl border border-gray-200 bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-error focus:ring-2 focus:ring-error/20"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setLossMode(false); setLossReason(""); }} className="rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-background">
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving || !lossReason.trim()}
              onClick={handleConfirmLoss}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "#FF6666" }}
            >
              Confirmar merma
            </button>
          </div>
        </div>
      )}

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
        <div className="flex items-start gap-2 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "#FF666655", backgroundColor: "#FF666612", color: "#FF6666" }}>
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Merma registrada{job.lossBy ? ` por ${job.lossBy}` : ""}</p>
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

      <div className="rounded-2xl border border-gray-200 bg-surface p-5">
        <SectionTitle icon={ListPlus}>Añadir detalles</SectionTitle>

        {(job.workItems ?? []).length > 0 && (
          <ol className="mb-4 space-y-3">
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

        {canUpdate && (
          <div className="flex gap-2">
            <input
              type="text"
              value={detailText}
              onChange={(e) => setDetailText(e.target.value)}
              placeholder="Escribe un detalle del trabajo..."
              className="flex-1 rounded-xl border border-gray-200 bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light"
            />
            <button
              type="button"
              disabled={saving || !detailText.trim()}
              onClick={handleAddDetail}
              className="rounded-xl bg-indigo-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Añadir
            </button>
          </div>
        )}
      </div>

    </div>
  );

}
