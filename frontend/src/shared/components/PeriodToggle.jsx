/**
 * Selector de período en pastillas (Hoy/Semana/Mes, Semanal/Mensual/Anual,
 * etc.) - usado por los dashboards de rol de Ópticas e Indigo. `periods` es
 * el arreglo propio de cada pantalla ([{ value, label }]); este componente
 * solo pinta los botones y avisa el cambio.
 */
export default function PeriodToggle({ periods, value, onChange }) {

  return (

    <div className="inline-flex rounded-xl border border-gray-200 bg-surface p-1">
      {periods.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            value === p.value ? "bg-indigo-primary text-white" : "text-text-secondary hover:bg-background"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>

  );

}
