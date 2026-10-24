import { Glasses, Eye, Sparkles } from "lucide-react";


/**
 * Decoracion de fondo para Nueva venta - mismo espiritu que
 * OpticaCardDecoration (iconos grandes y tenues, puramente decorativos),
 * pero con varios colores repartidos en las esquinas de la pagina
 * completa en vez de una sola tarjeta.
 */
export default function VentaPageDecoration() {
  return (
    <>
      {/* Esquina superior izquierda */}
      <Glasses strokeWidth={1} className="pointer-events-none absolute -left-16 -top-10 h-56 w-56 text-indigo-light" />
      <Sparkles className="pointer-events-none absolute left-24 top-2 h-5 w-5 text-sky-200" />
      <Sparkles className="pointer-events-none absolute left-6 top-32 h-4 w-4 text-blue-200" />

      {/* Esquina superior derecha */}
      <Eye strokeWidth={1} className="pointer-events-none absolute -right-10 top-24 h-40 w-40 text-purple-100" />
      <Sparkles className="pointer-events-none absolute right-40 top-10 h-4 w-4 text-rose-200" />
      <Glasses strokeWidth={1} className="pointer-events-none absolute right-4 -top-8 h-28 w-28 text-rose-100" />

      {/* Lado izquierdo, a media altura */}
      <Eye strokeWidth={1} className="pointer-events-none absolute -left-8 top-1/2 h-32 w-32 -translate-y-1/2 text-sky-100" />
      <Sparkles className="pointer-events-none absolute left-16 top-1/2 h-4 w-4 text-indigo-light" />

      {/* Lado derecho, a media altura */}
      <Glasses strokeWidth={1} className="pointer-events-none absolute -right-12 top-2/3 h-48 w-48 text-teal-100" />
      <Sparkles className="pointer-events-none absolute right-28 top-3/4 h-5 w-5 text-emerald-200" />

      {/* Esquina inferior derecha */}
      <Glasses strokeWidth={1} className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 text-amber-100" />
      <Sparkles className="pointer-events-none absolute bottom-24 right-48 h-5 w-5 text-teal-200" />

      {/* Esquina inferior izquierda */}
      <Eye strokeWidth={1} className="pointer-events-none absolute -bottom-10 -left-10 h-44 w-44 text-emerald-100" />
      <Sparkles className="pointer-events-none absolute bottom-32 left-32 h-4 w-4 text-purple-200" />
    </>
  );
}
