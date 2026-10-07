import { Store, Phone, Mail, Globe } from "lucide-react";


export default function PerfilTab({ info }) {

  return (
    <div className="rounded-2xl border border-gray-200 bg-surface p-8">

      <div className="flex flex-wrap items-center gap-6">

        <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-background">
          {info.logoUrl ? (
            <img src={info.logoUrl} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <Store className="h-12 w-12 text-text-secondary" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-text-primary">{info.nombreComercial || "Sin nombre"}</h2>
            <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              Empresa activa
            </span>
          </div>
          {info.eslogan && <p className="mt-1 text-base text-text-secondary">{info.eslogan}</p>}
        </div>

      </div>

      <div className="mt-8 grid gap-4 border-t border-gray-100 pt-6 sm:grid-cols-2">
        <Field label="Razón social" value={info.razonSocial} />
        <Field label="RFC" value={info.rfc} />
      </div>

      <div className="mt-6 grid gap-5 border-t border-gray-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        <MiniCard icon={Store} label="Responsable sanitario" value={info.responsableSanitario} />
        <MiniCard icon={Phone} label="Teléfono general" value={info.telefono} />
        <MiniCard icon={Mail} label="Correo general" value={info.correo} accent />
        <MiniCard icon={Globe} label="Sitio web" value={info.sitioWeb} accent />
      </div>

    </div>
  );

}


function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="mt-1 text-base font-bold text-text-primary">{value || "—"}</dd>
    </div>
  );
}

function MiniCard({ icon: Icon, label, value, accent = false }) {
  return (
    <div className="rounded-xl bg-indigo-light p-5 shadow-md shadow-indigo-light">
      <Icon className="mb-3 h-6 w-6 text-indigo-primary" />
      <p className="text-xs text-text-secondary">{label}</p>
      <p className={`mt-1 truncate text-base font-semibold ${accent ? "text-sky-600" : "text-text-primary"}`}>
        {value || "—"}
      </p>
    </div>
  );
}
