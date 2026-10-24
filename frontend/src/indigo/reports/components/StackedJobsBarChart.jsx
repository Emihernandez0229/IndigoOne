import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { CHART_COLORS, chartAxisProps, chartTooltipProps } from "../../../shared/charts/chartTheme";


const SERIES = [
  { key: "completed", label: "Terminada", color: CHART_COLORS.success },
  { key: "processing", label: "En proceso", color: CHART_COLORS.secondary },
  { key: "pending", label: "Pendiente", color: CHART_COLORS.warning },
  { key: "merma", label: "Mermas", color: CHART_COLORS.error },
];


export default function StackedJobsBarChart({ data = [], height = 280 }) {

  if (!data.length) {
    return (
      <div style={{ height }} className="flex w-full items-center justify-center text-sm text-text-secondary">
        Sin información disponible
      </div>
    );
  }

  return (
    <div>

      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis dataKey="name" {...chartAxisProps} />
            <YAxis {...chartAxisProps} width={40} />
            <Tooltip {...chartTooltipProps} cursor={{ fill: CHART_COLORS.grid }} />

            {SERIES.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} stackId="jobs" fill={s.color} maxBarSize={56} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-text-secondary">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

    </div>
  );

}
