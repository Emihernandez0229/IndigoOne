import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { CHART_COLORS, chartAxisProps, chartTooltipProps } from "./chartTheme";


/**
 * Grafica de linea compartida.
 * Trae su propio contenedor de alto: no hace falta envolverla.
 */
export default function LineChart({
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

        <RechartsLineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>

          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />

          <XAxis dataKey={labelKey} {...chartAxisProps} />

          <YAxis {...chartAxisProps} width={48} />

          <Tooltip {...chartTooltipProps} />

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={3}
            dot={{ r: 3, fill: color }}
            activeDot={{ r: 5 }}
          />

        </RechartsLineChart>

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
