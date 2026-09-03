import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { CHART_COLORS, chartAxisProps, chartTooltipProps } from "./chartTheme";


/**
 * Grafica de barras compartida (mismo lenguaje visual que LineChart).
 * Trae su propio contenedor de alto: no hace falta envolverla.
 */
export default function BarChart({
  data = [],
  dataKey,
  labelKey,
  height = 288,
  color = CHART_COLORS.primary,
}) {

  if (!data.length) {
    return <EmptyChart height={height} />;
  }


  return (

    <div style={{ height }} className="w-full">

      <ResponsiveContainer width="100%" height="100%">

        <RechartsBarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>

          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />

          <XAxis dataKey={labelKey} {...chartAxisProps} />

          <YAxis {...chartAxisProps} width={48} />

          <Tooltip {...chartTooltipProps} cursor={{ fill: CHART_COLORS.grid }} />

          <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={56} />

        </RechartsBarChart>

      </ResponsiveContainer>

    </div>

  );

}


function EmptyChart({ height }) {

  return (

    <div
      style={{ height }}
      className="
        flex
        w-full
        items-center
        justify-center
        text-sm
        text-text-secondary
      "
    >
      Sin información disponible
    </div>

  );

}
