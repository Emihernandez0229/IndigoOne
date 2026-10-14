import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from "recharts";

import { CHART_COLORS, chartAxisProps, chartTooltipProps } from "../../../shared/charts/chartTheme";
import { categoryOf, inRange, formatShortDate } from "../utils";


const MODES = [
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "bimester", label: "Bimestral" },
  { value: "semester", label: "Semestral" },
];


// Rango actual vs. el equivalente inmediatamente anterior, segun el modo.
function getComparisonRanges(mode) {
  const now = new Date();

  if (mode === "week") {
    const currentTo = now;
    const currentFrom = new Date(now); currentFrom.setDate(now.getDate() - 6); currentFrom.setHours(0, 0, 0, 0);
    const previousTo = new Date(currentFrom); previousTo.setDate(currentFrom.getDate() - 1); previousTo.setHours(23, 59, 59, 999);
    const previousFrom = new Date(previousTo); previousFrom.setDate(previousTo.getDate() - 6); previousFrom.setHours(0, 0, 0, 0);
    return { thisRange: { from: currentFrom, to: currentTo }, prevRange: { from: previousFrom, to: previousTo } };
  }

  const monthsBack = mode === "month" ? 1 : mode === "bimester" ? 2 : 6;
  const currentFrom = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);
  const currentTo = now;
  const previousFrom = new Date(now.getFullYear(), now.getMonth() - 2 * monthsBack + 1, 1);
  const previousTo = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 0, 23, 59, 59, 999);
  return { thisRange: { from: currentFrom, to: currentTo }, prevRange: { from: previousFrom, to: previousTo } };
}


function statsFor(jobs, range) {
  const scoped = jobs.filter((j) => inRange(j.entryAt, range));
  const total = scoped.length;
  const completed = scoped.filter((j) => categoryOf(j) === "completed").length;
  const merma = scoped.filter((j) => categoryOf(j) === "merma").length;
  const resolved = completed + merma;
  const effectiveness = resolved > 0 ? Math.round((completed / resolved) * 1000) / 10 : 100;
  return { total, completed, merma, effectiveness };
}


/**
 * "Comparativa con periodo anterior" (Reportes - Gerente/Subgerente): barras
 * agrupadas por metrica (Trabajos totales/Terminados/Merma/Efectividad),
 * este periodo vs. el anterior, con un toggle propio de granularidad.
 */
export default function PeriodComparisonChart({ jobs = [] }) {

  const [mode, setMode] = useState("month");

  const ranges = useMemo(() => getComparisonRanges(mode), [mode]);

  const data = useMemo(() => {
    const cur = statsFor(jobs, ranges.thisRange);
    const prev = statsFor(jobs, ranges.prevRange);

    return [
      { metric: "Trabajos totales", current: cur.total, previous: prev.total, isPct: false },
      { metric: "Terminados", current: cur.completed, previous: prev.completed, isPct: false },
      { metric: "Merma", current: cur.merma, previous: prev.merma, isPct: false },
      { metric: "Efectividad", current: cur.effectiveness, previous: prev.effectiveness, isPct: true },
    ];
  }, [jobs, ranges]);

  function ValueLabel({ x, y, width, value, index }) {
    const isPct = data[index]?.isPct;
    return (
      <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={12} fontWeight={700} fill={CHART_COLORS.primary}>
        {value}{isPct ? "%" : ""}
      </text>
    );
  }

  return (
    <div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1.5 text-text-primary">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.primary }} />
            Este periodo: <span className="font-semibold">{formatShortDate(ranges.thisRange.from)} – {formatShortDate(ranges.thisRange.to)}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-text-secondary">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.secondary }} />
            Periodo anterior: <span className="font-semibold">{formatShortDate(ranges.prevRange.from)} – {formatShortDate(ranges.prevRange.to)}</span>
          </span>
        </div>

        <div className="inline-flex rounded-xl border border-gray-200 bg-surface p-1">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                mode === m.value ? "bg-indigo-primary text-white" : "text-text-secondary hover:bg-background"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 280 }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>

            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis dataKey="metric" {...chartAxisProps} />
            <YAxis {...chartAxisProps} width={40} />
            <Tooltip {...chartTooltipProps} />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 13 }} />

            <Bar dataKey="current" name="Este periodo" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} maxBarSize={40}>
              <LabelList content={ValueLabel} />
            </Bar>
            <Bar dataKey="previous" name="Periodo anterior" fill={`${CHART_COLORS.secondary}55`} radius={[4, 4, 0, 0]} maxBarSize={40}>
              <LabelList content={ValueLabel} />
            </Bar>

          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );

}
