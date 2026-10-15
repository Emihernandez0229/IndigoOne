import DashboardKpi from "../dashboard/DashboardKpi";


// Tailwind necesita ver las clases completas en el codigo (no las arma en
// runtime), por eso el mapa en vez de interpolar el numero de columnas.
const GRID_COLS = {
  4: "grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4",
  5: "grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5",
  6: "grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6",
};


/**
 * Fila de tarjetas KPI reutilizable (dashboards y paginas de gestion).
 * Recibe un array de objetos { id, type, title, value, description, trend, trendDirection }.
 * `dense` = true cuando se necesitan tarjetas mas compactas (ej. 6 KPIs de
 * Laboratorio). `columns` fuerza el numero de columnas (4/5/6) sin tocar el
 * tamaño de las tarjetas, util cuando se quiere una fila de 5 a tamaño normal.
 */
export default function KpiRow({ items = [], dense = false, columns }) {

  if (!items.length) {
    return null;
  }

  const cols = columns ?? (dense ? 6 : 4);

  return (

    <div className={`grid ${GRID_COLS[cols]}`}>

      {items.map((kpi) => (
        <DashboardKpi
          key={kpi.id ?? kpi.title}
          dense={dense}
          {...kpi}
        />
      ))}

    </div>

  );

}
