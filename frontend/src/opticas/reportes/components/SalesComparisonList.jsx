const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;


/**
 * Lista de barras horizontales comparando un valor (monto o conteo) entre
 * sucursales, empleados, productos, servicios, etc. - mismo lenguaje visual
 * que BranchMetricComparisonList (Indigo). `formatValue` controla cómo se
 * muestra el número a la derecha (pesos por default, o un conteo simple).
 */
export default function SalesComparisonList({ items = [], formatValue = currency }) {

  if (!items.length) {
    return <p className="text-sm text-text-secondary">Sin información disponible</p>;
  }

  const sorted = [...items].sort((a, b) => b.total - a.total);
  const maxValue = Math.max(...sorted.map((item) => item.total), 1);

  return (
    <div className="space-y-4">

      {sorted.map((item) => (
        <div key={item.id}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-text-primary">{item.name}</span>
            <span className="font-semibold text-text-primary">{formatValue(item.total)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full bg-indigo-primary"
              style={{ width: `${(item.total / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}

    </div>
  );

}
