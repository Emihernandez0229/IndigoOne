import { CHART_COLORS } from "../../../shared/charts/chartTheme";


const SERIES = [
  { key: "pending", label: "Pendientes", color: CHART_COLORS.warning },
  { key: "processing", label: "En proceso", color: CHART_COLORS.secondary },
  { key: "completed", label: "Terminados", color: CHART_COLORS.success },
  { key: "merma", label: "Mermas", color: CHART_COLORS.error },
];


/**
 * Barras horizontales apiladas por sucursal (Dashboard de Dueño).
 * `data` = [{ id, name, pending, processing, completed, merma, total }],
 * cada barra escalada contra la sucursal con mas trabajos.
 */
export default function BranchJobsStackedBar({ data = [] }) {

  if (!data.length) {
    return <p className="text-sm text-text-secondary">Sin información disponible</p>;
  }

  const maxTotal = Math.max(...data.map((b) => b.total), 1);

  return (
    <div className="space-y-5">

      <div className="flex flex-wrap justify-center gap-4 text-sm">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-text-secondary">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <div className="space-y-4">
        {data.map((b) => (
          <div key={b.id} className="group relative flex items-center gap-3">

            <span className="w-24 shrink-0 truncate text-sm font-semibold text-text-primary">{b.name}</span>

            <div className="h-5 flex-1">
              <div
                className="flex h-full overflow-hidden rounded-full"
                style={{ width: `${(b.total / maxTotal) * 100}%` }}
              >
                {SERIES.map((s) => {
                  const value = b[s.key] ?? 0;
                  if (!value || !b.total) return null;
                  return (
                    <div
                      key={s.key}
                      style={{ width: `${(value / b.total) * 100}%`, backgroundColor: s.color }}
                    />
                  );
                })}
              </div>
            </div>

            <span className="w-10 shrink-0 text-right text-sm font-bold text-text-primary">{b.total}</span>

            <div className="pointer-events-none absolute bottom-full left-24 z-20 mb-2 hidden min-w-[150px] rounded-xl border border-gray-200 bg-surface p-3 shadow-lg group-hover:block">
              <p className="mb-1.5 text-sm font-bold text-text-primary">{b.name}</p>
              <div className="space-y-0.5">
                {SERIES.map((s) => (
                  <p key={s.key} className="text-xs text-text-secondary">
                    {s.label}: <span className="font-semibold" style={{ color: s.color }}>{b[s.key] ?? 0}</span>
                  </p>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );

}
