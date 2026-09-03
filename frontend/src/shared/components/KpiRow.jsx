import DashboardKpi from "../dashboard/DashboardKpi";


/**
 * Fila de tarjetas KPI reutilizable (dashboards y paginas de gestion).
 * Recibe un array de objetos { id, type, title, value, description, trend, trendDirection }.
 */
export default function KpiRow({ items = [] }) {

  if (!items.length) {
    return null;
  }


  return (

    <div
      className="
        grid
        grid-cols-1
        gap-5
        sm:grid-cols-2
        xl:grid-cols-4
      "
    >

      {items.map((kpi) => (
        <DashboardKpi
          key={kpi.id ?? kpi.title}
          {...kpi}
        />
      ))}

    </div>

  );

}
