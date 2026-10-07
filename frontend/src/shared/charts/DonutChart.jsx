import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import { chartTooltipProps } from "./chartTheme";


/**
 * Grafica de dona con leyenda a un lado y un numero total al centro.
 * `data` = [{ label, value, color }]
 */
export default function DonutChart({ data = [], height = 200, centerLabel }) {

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

  if (!data.length || total === 0) {
    return (
      <div style={{ height }} className="flex w-full items-center justify-center text-sm text-text-secondary">
        Sin información disponible
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-6">

      <div style={{ width: height, height }} className="relative shrink-0">

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip {...chartTooltipProps} />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-text-primary">{total}</p>
          {centerLabel && <p className="text-xs text-text-secondary">{centerLabel}</p>}
        </div>

      </div>

      <div className="flex-1 space-y-2.5">
        {data.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2 text-text-secondary">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
            <span className="font-semibold text-text-primary">{item.value}</span>
          </div>
        ))}
      </div>

    </div>
  );

}
