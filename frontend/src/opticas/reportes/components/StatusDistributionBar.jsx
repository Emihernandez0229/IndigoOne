/**
 * Barra apilada + leyenda mostrando qué proporción de un total cayó en
 * cada estado (ej. citas atendidas/canceladas/no asistió).
 */
export default function StatusDistributionBar({ segments = [] }) {

  const total = segments.reduce((sum, s) => sum + s.count, 0);

  if (!total) {
    return <p className="text-sm text-text-secondary">Sin información disponible</p>;
  }

  return (
    <div className="space-y-4">

      <div className="flex h-3 w-full overflow-hidden rounded-full bg-background">
        {segments.filter((s) => s.count > 0).map((s) => (
          <div key={s.id} style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
        ))}
      </div>

      <div className="space-y-2.5">
        {segments.map((s) => (
          <div key={s.id} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-text-primary">{s.label}</span>
            </span>
            <span className="font-medium text-text-primary">{s.count} · {s.pct}%</span>
          </div>
        ))}
      </div>

    </div>
  );

}
