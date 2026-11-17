import DashboardPanel from "../../../shared/dashboard/DashboardPanel";

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "justo ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}


/**
 * Feed de actividad reciente: recibe `items` ya armados (ver
 * OwnerDashboardOpticas, que mezcla ventas y movimientos de inventario)
 * para quedarse solo con la presentación. Misma altura que su vecino
 * (Stock crítico) - ver `h-full` + flex en el contenedor.
 */
export default function RecentActivityFeed({ items = [] }) {

  return (

    <DashboardPanel title="Actividad reciente" className="flex h-full flex-col">

      {items.length === 0 ? (
        <p className="text-sm text-text-secondary">Sin actividad reciente.</p>
      ) : (
        <div className="flex-1 space-y-6">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-start gap-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}>
                  <Icon className={`h-5 w-5 ${item.iconColor}`} />
                </span>
                <div className="min-w-0">
                  <p className="text-base text-text-primary">
                    <span className="font-semibold">{item.actor}</span> {item.description}
                  </p>
                  <p className="text-sm text-text-secondary">{timeAgo(item.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </DashboardPanel>

  );

}
