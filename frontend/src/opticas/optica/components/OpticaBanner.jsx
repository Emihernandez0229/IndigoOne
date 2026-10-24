import { Store, Check } from "lucide-react";


/**
 * Barra de perfil de la óptica: logo, nombre comercial y eslogan sobre un
 * fondo de color sólido de marca - visible en todas las pestañas de
 * "Mi óptica", no solo en una.
 */
export default function OpticaBanner({ info }) {

  return (
    <div className="relative overflow-hidden rounded-2xl bg-indigo-primary px-6 py-6 sm:px-8">

      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-16 right-24 h-32 w-32 rounded-full bg-white/5" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
            {info.logoUrl ? (
              <img src={info.logoUrl} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <Store className="h-7 w-7 text-indigo-primary" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">{info.nombreComercial || "Sin nombre"}</h2>
            {info.eslogan && <p className="mt-0.5 text-sm text-white/80">{info.eslogan}</p>}
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white">
          <Check className="h-4 w-4" />
          Perfil de empresa
        </span>

      </div>

    </div>
  );

}
