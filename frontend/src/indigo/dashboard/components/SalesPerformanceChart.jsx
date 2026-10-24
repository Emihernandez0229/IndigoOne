import { ResponsiveContainer, ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

import { CHART_COLORS, chartAxisProps, chartTooltipProps } from "../../../shared/charts/chartTheme";


function formatCurrency(value) {
  return `$${Number(value).toLocaleString("es-MX")}`;
}


// Etiqueta flotante tipo "pill" solo sobre el ultimo punto (el periodo
// actual), igual al estilo de referencia.
function LastPointLabel({ x, y, value, index, lastIndex, valueFormatter }) {
  if (index !== lastIndex) return null;

  const text = valueFormatter(value);
  const width = text.length * 7.5 + 24;

  return (
    <g>
      <rect
        x={x - width / 2} y={y - 36} width={width} height={26} rx={13}
        fill={`${CHART_COLORS.secondary}1F`} stroke={CHART_COLORS.primary} strokeWidth={1}
      />
      <text x={x} y={y - 19} textAnchor="middle" fontSize={12} fontWeight={700} fill={CHART_COLORS.primary}>
        {text}
      </text>
    </g>
  );
}


/**
 * Barras + linea de tendencia (combo chart), ej. "Rendimiento de ventas en
 * mi sucursal" (Gerente/Subgerente) o "Flujo de producción" (Laboratorio).
 * `data` = [{ label, [dataKey]: valor }], la ultima barra (periodo actual)
 * se resalta y lleva la etiqueta flotante con `valueFormatter`.
 */
export default function SalesPerformanceChart({
  data = [],
  height = 280,
  dataKey = "amount",
  valueFormatter = formatCurrency,
  yTickFormatter = (v) => `${Math.round(v / 1000)}k`,
}) {

  if (!data.length) {
    return (
      <div style={{ height }} className="flex w-full items-center justify-center text-sm text-text-secondary">
        Sin información disponible
      </div>
    );
  }

  const lastIndex = data.length - 1;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 32, right: 16, bottom: 0, left: 0 }}>

          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />

          <XAxis dataKey="label" {...chartAxisProps} />
          <YAxis {...chartAxisProps} width={56} tickFormatter={yTickFormatter} />

          <Tooltip {...chartTooltipProps} formatter={(v) => valueFormatter(v)} />

          <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((d, index) => (
              <Cell key={d.label} fill={index === lastIndex ? CHART_COLORS.secondary : `${CHART_COLORS.secondary}33`} />
            ))}
          </Bar>

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={CHART_COLORS.primary}
            strokeWidth={2.5}
            dot={{ r: 3, fill: CHART_COLORS.primary }}
            activeDot={{ r: 5 }}
            label={(props) => <LastPointLabel {...props} lastIndex={lastIndex} valueFormatter={valueFormatter} />}
          />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

}
