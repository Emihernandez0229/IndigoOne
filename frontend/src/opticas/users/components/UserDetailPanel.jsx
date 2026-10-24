import { Ban, RotateCcw, Users, Building2, ShieldCheck } from "lucide-react";

import StatusBadge from "../../../shared/components/StatusBadge";
import { USER_ROLE_LABELS } from "../constants";


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


export default function UserDetailPanel({ user, canDeactivate = false, onDeactivate, onActivate }) {

  if (!user) return null;

  return (
    <div className="space-y-6">

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-light text-lg font-bold text-indigo-primary">
          {(user.name || "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">{user.name}</h2>
          <span className="inline-flex items-center rounded-full bg-indigo-light px-3 py-1 text-xs font-medium text-indigo-primary">
            {USER_ROLE_LABELS[user.role] ?? user.role}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-surface p-5">
        <SectionTitle icon={Users}>Información personal</SectionTitle>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="col-span-2">
            <Field label="Nombre completo" value={user.name} />
          </div>
          <Field label="Usuario" value={user.username} />
          <Field label="Teléfono" value={user.phone} />
          <Field label="Correo electrónico" value={user.email} />
        </dl>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-surface p-5">
        <SectionTitle icon={Building2}>Sucursal asignada</SectionTitle>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="col-span-2">
            <Field label="Sucursal" value={user.branchName} />
          </div>
          <div className="col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Estado de la cuenta</dt>
            <dd className="mt-1"><StatusBadge status={user.status} label={user.status === "active" ? "Activo" : "Inactivo"} /></dd>
          </div>
        </dl>
      </div>

      {canDeactivate && (
        <div className="rounded-2xl border border-gray-200 bg-surface p-5">
          <SectionTitle icon={ShieldCheck}>Acciones administrativas</SectionTitle>
          <div className="space-y-3">
            {user.status === "active" ? (
              <button
                type="button"
                onClick={() => onDeactivate?.(user)}
                className="flex w-full items-center gap-2 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error transition hover:bg-error/10"
              >
                <Ban className="h-4 w-4" />
                Dar de baja
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onActivate?.(user)}
                className="flex w-full items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm font-medium text-success transition hover:bg-success/10"
              >
                <RotateCcw className="h-4 w-4" />
                Dar de alta
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );

}
