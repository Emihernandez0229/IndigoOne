import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { CHART_COLORS, chartAxisProps, chartTooltipProps } from "../../../shared/charts/chartTheme";


const SERIES = [
  { key: "registrados", label: "Registrados", color: CHART_COLORS.secondary },
  { key: "terminados", label: "Terminados", color: CHART_COLORS.success },
];


export default function TrendLineChart({ data = [], height = 240 }) {

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
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis dataKey="name" {...chartAxisProps} />
            <YAxis {...chartAxisProps} width={40} />
            <Tooltip {...chartTooltipProps} />

            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2.5}
                dot={{ r: 4, fill: s.color, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
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
