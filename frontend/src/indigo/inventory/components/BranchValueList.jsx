/**
 * Lista de barras horizontales con el valor de inventario ($ ) por
 * sucursal, usado en el aside de Inventario.
 */
export default function BranchValueList({ branches = [] }) {

  if (!branches.length) {
    return <p className="text-sm text-text-secondary">Sin información disponible</p>;
  }

  const maxValue = Math.max(...branches.map((b) => b.value), 1);
  const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;

  return (
    <div className="space-y-4">
      {branches.map((b) => (
        <div key={b.id}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-text-primary">{b.name}</span>
            <span className="text-text-secondary">{currency(b.value)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full bg-indigo-primary"
              style={{ width: `${(b.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );

}
