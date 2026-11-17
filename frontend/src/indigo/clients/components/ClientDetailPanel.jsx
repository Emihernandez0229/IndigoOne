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


export default function ClientDetailPanel({ client, showBranches = true }) {

  if (!client) return null;

  const branches = client.branches ?? [];

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
          <Field label="Código" value={client.code} />
          <Field label="RFC" value={client.rfc} />
          <div className="col-span-2">
            <Field label="Nombre de la óptica" value={client.name} />
          </div>
          <Field label="Teléfono" value={client.phone} />
          <Field label="Correo electrónico" value={client.email} />
          <div className="col-span-2">
            <Field label="Dirección fiscal" value={client.fiscalAddress} />
          </div>
        </dl>
      </div>

      {showBranches && (
        <div className="rounded-2xl border border-gray-200 bg-surface p-5">
          <SectionTitle icon={Building2}>Sucursales ({branches.length})</SectionTitle>

          {branches.length === 0 ? (
            <p className="text-sm text-text-secondary">Sin sucursales registradas.</p>
          ) : (
            <div className="space-y-3">
              {branches.map((branch) => (
                <div key={branch.id} className="flex items-center justify-between rounded-xl bg-background px-4 py-3">
                  <div>
                    <p className="font-medium text-text-primary">{branch.name}</p>
                    <p className="text-sm text-text-secondary">
                      Cliente de: {branch.indigoBranchName || "Sin proveedor asignado"}
                    </p>
                  </div>
                  <StatusBadge status={branch.status} label={branch.status === "active" ? "Activa" : "Inactiva"} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );

}