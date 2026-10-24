import { Fragment } from "react";
import { useNavigate } from "react-router-dom";

import { CHART_COLORS } from "../../../shared/charts/chartTheme";


/**
 * "Actividad del equipo" (Dashboard de Gerente/Subgerente): columna
 * izquierda = ventas / trabajos registrados por vendedor, columna derecha =
 * terminados / mermas por laboratorista (en tabla, numeros alineados bajo
 * cada encabezado). `sales`/`lab` ya deben venir ordenados por quien llama.
 */
export default function TeamActivityPanel({ sales = [], lab = [] }) {

  const navigate = useNavigate();

  const maxSales = Math.max(...sales.map((s) => s.count), 1);

  return (
    <section className="rounded-2xl border border-gray-200 bg-surface p-5">

      <header className="mb-5 flex items-start justify-between gap-4">
        <h2 className="text-base font-semibold text-text-primary">Actividad del equipo</h2>
        <button
          type="button"
          onClick={() => navigate("/indigo/reportes")}
          className="text-sm font-medium text-indigo-primary hover:underline"
        >
          Ver reportes →
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Ventas · Trabajos registrados
          </p>

          {sales.length === 0 ? (
            <p className="text-sm text-text-secondary">Sin información disponible</p>
          ) : (
            <div className="space-y-3">
              {sales.map((s) => (
                <div key={s.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-text-primary">{s.name}</span>
                    <span className="font-semibold text-text-secondary">{s.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(s.count / maxSales) * 100}%`, backgroundColor: CHART_COLORS.secondary }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Laboratorio
          </p>

          {lab.length === 0 ? (
            <p className="text-sm text-text-secondary">Sin información disponible</p>
          ) : (
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 gap-y-2.5">

              <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary" />
              <span className="text-right text-xs font-semibold uppercase tracking-wide text-text-secondary">Terminados</span>
              <span className="text-right text-xs font-semibold uppercase tracking-wide text-text-secondary">Mermas</span>
              <span className="text-right text-xs font-semibold uppercase tracking-wide text-text-secondary">% Merma</span>

              {lab.map((l) => (
                <Fragment key={l.name}>
                  <span className="text-sm font-medium text-text-primary">{l.name}</span>
                  <span className="text-right text-sm text-text-primary">{l.completed}</span>
                  <span className="text-right text-sm font-semibold" style={{ color: l.merma > 0 ? CHART_COLORS.error : undefined }}>
                    {l.merma}
                  </span>
                  <span className="text-right text-sm font-semibold" style={{ color: l.pctMerma > 0 ? CHART_COLORS.error : undefined }}>
                    {l.pctMerma}%
                  </span>
                </Fragment>
              ))}

            </div>
          )}
        </div>

      </div>

    </section>
  );

}
