import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lightbulb, Store } from "lucide-react";

import LineChart from "../../../shared/charts/LineChart";
import DataTable from "../../../shared/components/DataTable";
import { CHART_COLORS } from "../../../shared/charts/chartTheme";


const PERIOD_OF_TEXT = {
  day: "de hoy",
  week: "de esta semana",
  month: "de este mes",
};


function shortName(name) {
  return name.replace(/^Indigo\s+/i, "");
}


function computeEffectiveness(branchStats) {
  return branchStats.map((b) => {
    const resolved = b.completed + b.merma;
    const effectiveness = resolved > 0 ? Math.round((b.completed / resolved) * 100) : 100;
    const mermaRate = resolved > 0 ? Math.round((b.merma / resolved) * 1000) / 10 : 0;
    return { ...b, effectiveness, mermaRate };
  });
}


/**
 * Seccion de ancho completo del Dashboard de Dueño: por default muestra la
 * grafica de linea "% de efectividad" por sucursal; el boton "Ver mas" la
 * cambia a una tabla con el detalle (terminados/mermas/% merma/pendientes).
 */
export default function BranchEffectivenessPanel({ branchStats, period }) {

  const navigate = useNavigate();
  const [view, setView] = useState("chart");

  const stats = useMemo(() => computeEffectiveness(branchStats), [branchStats]);
  const chartData = useMemo(() => stats.map((b) => ({ name: shortName(b.name), effectiveness: b.effectiveness })), [stats]);
  const worst = useMemo(
    () => stats.reduce((acc, b) => (!acc || b.mermaRate > acc.mermaRate ? b : acc), null),
    [stats]
  );

  const periodOf = PERIOD_OF_TEXT[period];

  const columns = [
    {
      key: "name",
      label: "Sucursal",
      render: (row) => (
        <span className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-light">
            <Store className="h-4 w-4 text-indigo-primary" />
          </span>
          <span className="font-semibold text-text-primary">{shortName(row.name)}</span>
          {worst && row.id === worst.id && row.mermaRate > 0 && (
            <span className="rounded-full bg-error/10 px-2 py-0.5 text-xs font-medium text-error">Mayor merma</span>
          )}
        </span>
      ),
    },
    { key: "completed", label: "Terminados" },
    { key: "merma", label: "Mermas" },
    {
      key: "mermaRate",
      label: "% Merma",
      render: (row) => {
        const tone = row.mermaRate >= 5 ? "bg-error/10 text-error" : row.mermaRate >= 3 ? "bg-warning/10 text-warning" : "bg-background text-text-secondary";
        return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{row.mermaRate}%</span>;
      },
    },
    { key: "pending", label: "Pendientes" },
    {
      key: "effectiveness",
      label: "% Efectividad",
      render: (row) => {
        const color = row.effectiveness >= 93 ? CHART_COLORS.success : CHART_COLORS.secondary;
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-20 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full" style={{ width: `${row.effectiveness}%`, backgroundColor: color }} />
            </div>
            <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: `${color}1A`, color }}>
              {row.effectiveness}%
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <section className="rounded-2xl border border-gray-200 bg-surface p-5">

      {view === "chart" ? (
        <>
          <header className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary">% de efectividad</h2>
              <p className="mt-1 text-sm text-text-secondary">Por sucursal · {periodOf}</p>
            </div>
            <button
              type="button"
              onClick={() => setView("table")}
              className="text-sm font-medium text-indigo-primary hover:underline"
            >
              Ver más →
            </button>
          </header>

          <LineChart data={chartData} dataKey="effectiveness" labelKey="name" showValues valueFormatter={(v) => `${v}%`} />
        </>
      ) : (
        <>
          <header className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Sucursales · {periodOf}</h2>
              <p className="mt-1 text-sm text-text-secondary">Rendimiento operacional por sucursal</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setView("chart")}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-text-secondary transition hover:bg-background"
              >
                Ver menos
              </button>
              <button
                type="button"
                onClick={() => navigate("/indigo/reportes")}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-text-secondary transition hover:bg-background"
              >
                Ver reportes →
              </button>
            </div>
          </header>

          <DataTable columns={columns} data={stats} emptyMessage="Sin información disponible." />

          {worst && worst.mermaRate > 0 && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-gray-200 bg-background p-4">
              <Lightbulb className="h-5 w-5 shrink-0 text-indigo-primary" />
              <p className="text-sm text-text-primary">
                <strong>{shortName(worst.name)}</strong> presenta el mayor porcentaje de merma {periodOf} (<strong>{worst.mermaRate}%</strong>).
                <br />
                <span className="text-text-secondary">Revisa los procesos de esta sucursal para identificar oportunidades de mejora.</span>
              </p>
            </div>
          )}
        </>
      )}

    </section>
  );

}
