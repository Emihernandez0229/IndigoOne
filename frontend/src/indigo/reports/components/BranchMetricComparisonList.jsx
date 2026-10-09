/**
 * Lista de barras horizontales comparando una metrica entre sucursales
 * (mermas, trabajos terminados, etc). `branches` ya debe venir ordenada
 * por quien llama (de mayor a menor).
 *   <BranchMetricComparisonList branches={stats} valueKey="merma" pctKey="pctMerma" color="#E5484D" footnote="..." />
 */
export default function BranchMetricComparisonList({ branches = [], valueKey, pctKey, color, footnote }) {

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
            <span className="text-text-secondary">{b[valueKey]} ({b[pctKey]}%)</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full"
              style={{ width: `${(b[valueKey] / maxValue) * 100}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}

      {footnote && <p className="pt-1 text-xs text-text-secondary">{footnote}</p>}

    </div>
  );

}
