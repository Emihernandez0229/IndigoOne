import { Glasses, Eye, Sparkles } from "lucide-react";


/**
 * Decoracion de fondo para Nueva consulta - mismo espiritu que
 * VentaPageDecoration (iconos grandes y tenues, puramente decorativos),
 * pero concentrada en los laterales (la pagina es una sola columna
 * angosta centrada, con mucho espacio vacio a los lados) en vez de las
 * 4 esquinas.
 */
export default function ConsultaPageDecoration() {
  return (
    <>
      {/* Lateral izquierdo */}
      <Glasses strokeWidth={1} className="pointer-events-none absolute -left-16 top-10 h-48 w-48 text-indigo-light" />
      <Eye strokeWidth={1} className="pointer-events-none absolute -left-10 top-1/2 h-36 w-36 -translate-y-1/2 text-sky-100" />
      <Sparkles className="pointer-events-none absolute left-10 top-1/3 h-4 w-4 text-indigo-light" />
      <Glasses strokeWidth={1} className="pointer-events-none absolute -left-12 bottom-10 h-40 w-40 text-emerald-100" />

      {/* Lateral derecho */}
      <Eye strokeWidth={1} className="pointer-events-none absolute -right-10 top-16 h-40 w-40 text-purple-100" />
      <Glasses strokeWidth={1} className="pointer-events-none absolute -right-14 top-1/2 h-52 w-52 -translate-y-1/2 text-rose-100" />
      <Sparkles className="pointer-events-none absolute right-10 top-2/3 h-5 w-5 text-teal-200" />
      <Eye strokeWidth={1} className="pointer-events-none absolute -right-8 bottom-8 h-32 w-32 text-amber-100" />
    </>
  );
}
