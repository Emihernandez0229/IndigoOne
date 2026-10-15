import { ArrowRight } from "lucide-react";

import { BITACORA_TYPES } from "../constants";
import { USER_ROLE_LABELS } from "../../users/constants";


function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" });
}


function InfoBox({ label, name, meta }) {
  return (
    <div className="rounded-xl bg-background p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="mt-1 text-sm font-bold text-text-primary">[{name}]</p>
      {meta && <p className="text-xs text-text-secondary">{meta}</p>}
    </div>
  );
}


export default function BitacoraDetailPanel({ entry }) {

  if (!entry) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-surface p-6 text-center text-sm text-text-secondary">
        Selecciona un registro para ver el detalle.
      </div>
    );
  }

  const meta = BITACORA_TYPES[entry.tipo];
  const actorRoleLabel = USER_ROLE_LABELS[entry.actorRole] ?? entry.actorRole;
  const targetRoleLabel = USER_ROLE_LABELS[entry.targetRole] ?? entry.targetRole;

  return (
    <div className="space-y-5 rounded-2xl border border-gray-200 bg-surface p-5">

      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${meta?.color}1A`, color: meta?.color }}>
        {meta?.label}
      </span>

      <div>
        <p className="text-sm font-semibold text-text-primary">
          [{entry.actorName}] {meta?.verb} [{entry.targetName}]
          {entry.tipo === "alta_usuario" && ` como ${targetRoleLabel}${entry.targetBranchName ? ` en Sucursal ${entry.targetBranchName}` : ""}`}
        </p>
        <p className="mt-1 text-xs text-text-secondary">{formatDateTime(entry.at)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InfoBox label="Realizado por" name={entry.actorName} meta={[actorRoleLabel, entry.actorBranchName].filter(Boolean).join(" · ")} />
        <InfoBox label="Usuario afectado" name={entry.targetName} meta={[entry.targetUsername, targetRoleLabel].filter(Boolean).join(" · ")} />
      </div>

      {entry.changes?.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Cambios</p>
          <div className="space-y-2 rounded-xl border border-gray-200 bg-background p-3">
            {entry.changes.map((c) => (
              <div key={c.field} className="flex items-center justify-between gap-2 text-sm">
                <span className="w-24 shrink-0 text-text-secondary">{c.field}</span>
                <span className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
                  <span className="truncate text-text-secondary">{c.before}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                  <span className="truncate font-semibold text-text-primary">{c.after}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );

}
