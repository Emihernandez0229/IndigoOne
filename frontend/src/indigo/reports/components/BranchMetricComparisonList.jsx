/**
 * Lista de barras horizontales comparando una metrica entre sucursales
 * (mermas, trabajos terminados, efectividad, etc). `branches` ya debe venir
 * ordenada por quien llama (de mayor a menor, o en el orden que se quiera
 * mostrar). `valueSuffix` se agrega despues del valor crudo (ej. "%" para
 * una metrica que ya es un porcentaje). `colorForItem(branch)` permite
 * pintar una barra puntual distinto (ej. resaltar la peor sucursal).
 *   <BranchMetricComparisonList branches={stats} valueKey="merma" pctKey="pctMerma" color="#E5484D" footnote="..." />
 */
export default function BranchMetricComparisonList({ branches = [], valueKey, pctKey, color, footnote, showPercent = true, valueSuffix = "", colorForItem }) {

  if (!branches.length) {
    return <p className="text-sm text-text-secondary">Sin información disponible</p>;
  }

  const maxValue = Math.max(...branches.map((b) => b[valueKey]), 1);

  return (
    <div className="space-y-4">

      {branches.map((b) => (
        <div key={b.id}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-text-primary">{b.name}</span>
            <span className="text-text-secondary">{b[valueKey]}{valueSuffix}{showPercent ? ` (${b[pctKey]}%)` : ""}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full"
              style={{ width: `${(b[valueKey] / maxValue) * 100}%`, backgroundColor: colorForItem ? colorForItem(b) : color }}
            />
          </div>
        </div>
      ))}

      {footnote && <p className="pt-1 text-xs text-text-secondary">{footnote}</p>}

    </div>
  );

}
