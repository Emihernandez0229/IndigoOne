import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

import { CHART_COLORS, chartAxisProps, chartTooltipProps } from "../../../shared/charts/chartTheme";


/**
 * "Trabajos en el tiempo" (Reportes - Gerente/Subgerente): barras de
 * registrados/terminados contra el eje izquierdo, linea de % de
 * efectividad contra un eje derecho (0-100%).
 * `data` = [{ name, registrados, terminados, efectividad }]
 */
export default function JobsEffectivenessTrendChart({ data = [], height = 300 }) {

  if (!data.length) {
    return (
      <div style={{ height }} className="flex w-full items-center justify-center text-sm text-text-secondary">
        Sin información disponible
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>

          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />

          <XAxis dataKey="name" {...chartAxisProps} />
          <YAxis yAxisId="left" {...chartAxisProps} width={40} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} {...chartAxisProps} width={48} />

          <Tooltip {...chartTooltipProps} formatter={(v, name) => (name === "% Efectividad" ? `${v}%` : v)} />
          <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 13 }} />

          <Bar yAxisId="left" dataKey="terminados" name="Terminados" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar yAxisId="left" dataKey="registrados" name="Registrados" fill={`${CHART_COLORS.secondary}55`} radius={[4, 4, 0, 0]} maxBarSize={28} />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="efectividad"
            name="% Efectividad"
            stroke={CHART_COLORS.primary}
            strokeWidth={2.5}
            dot={{ r: 4, fill: CHART_COLORS.primary }}
            activeDot={{ r: 6 }}
          />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

}
