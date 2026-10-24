function Group({ title, items, color }) {

  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">{title}</p>
      <div className="space-y-2.5">
        {items.map((i) => (
          <div key={i.name} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-sm font-medium text-indigo-primary">{i.name}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full" style={{ width: `${(i.value / max) * 100}%`, backgroundColor: color }} />
            </div>
            <span className="w-5 shrink-0 text-right text-sm font-semibold text-text-primary">{i.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

}


/**
 * "Mermas por tipo" (Reportes - Dueño): dos grupos de barras horizontales,
 * mermas por tipo de bisel y por tipo de servicio (urgente/normal), cada
 * grupo escalado contra su propio maximo.
 *   <MermasByTypeList bisel={[{name,value}]} service={[{name,value}]} color="#F97316" />
 */
export default function MermasByTypeList({ bisel = [], service = [], color }) {

  if (!bisel.length && !service.length) {
    return <p className="text-sm text-text-secondary">Sin información disponible</p>;
  }

  return (
    <div className="space-y-5">
      {bisel.length > 0 && <Group title="Tipo de bisel" items={bisel} color={color} />}
      {service.length > 0 && <Group title="Tipo de servicio" items={service} color={color} />}
    </div>
  );

}
