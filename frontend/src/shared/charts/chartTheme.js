/**
 * Mantiene Indigo y Opticas con el mismo estilo.
 */
export const CHART_COLORS = {
  primary: "#29347A",   // indigo-primary
  secondary: "#5565C8", // indigo-secondary
  grid: "#E5E7EB",      // gray-200
  axis: "#667085",      // text-secondary
};


export const chartAxisProps = {
  stroke: CHART_COLORS.axis,
  tick: { fill: CHART_COLORS.axis, fontSize: 12 },
  tickLine: false,
  axisLine: false,
};


export const chartTooltipProps = {
  contentStyle: {
    borderRadius: 12,
    border: "1px solid #E5E7EB",
    fontSize: 13,
  },
  labelStyle: {
    color: "#182033",
    fontWeight: 600,
  },
};
