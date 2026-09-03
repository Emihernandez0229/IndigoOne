import LineChart from "../../../shared/charts/LineChart";


/**
 * Ventas de la optica. Reutiliza la grafica de linea compartida.
 */
export default function SalesChart({ data = [] }) {

  return (
    <LineChart
      data={data}
      dataKey="value"
      labelKey="day"
    />
  );

}
