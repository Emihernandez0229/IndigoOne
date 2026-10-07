import { Info, Building2 } from "lucide-react";

import StatusBadge from "../../../shared/components/StatusBadge";


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


export default function ClientDetailPanel({ client }) {

  if (!client) return null;

  return (
    <div className="space-y-6">

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-light text-lg font-bold text-indigo-primary">
          {(client.name || "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">{client.name}</h2>
          <StatusBadge status={client.status} label={client.status === "active" ? "Activo" : "Inactivo"} />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-surface p-5">
        <SectionTitle icon={Info}>Datos del cliente</SectionTitle>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="col-span-2">
            <Field label="Razón social" value={client.businessName} />
          </div>
          <Field label="Código" value={client.code} />
          <Field label="Teléfono" value={client.phone} />
          <div className="col-span-2">
            <Field label="Correo electrónico" value={client.email} />
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-surface p-5">
        <SectionTitle icon={Building2}>Sucursal</SectionTitle>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="col-span-2">
            <Field label="Sucursal a la que pertenece" value={client.branchName} />
          </div>
        </dl>
      </div>

    </div>
  );

}
