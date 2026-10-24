/**
 * Barra de pestañas subrayadas, reutilizable en cualquier página que
 * necesite navegar entre secciones sin cambiar de ruta.
 *   <TabBar tabs={[{value:"a",label:"A"}]} active={tab} onChange={setTab} />
 */
export default function TabBar({ tabs = [], active, onChange }) {

  return (
    <div className="flex flex-wrap gap-6 border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`
            -mb-px
            border-b-2
            pb-3
            text-sm
            font-medium
            transition
            ${
              active === tab.value
                ? "border-indigo-primary text-indigo-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

}
