import { Fragment } from "react";

import { CHART_COLORS } from "../../../shared/charts/chartTheme";


/**
 * Tabla compacta "Terminados / Mermas / % Merma" por laboratorista
 * (Reportes - vista de una sucursal). `people` ya debe venir ordenada por
 * quien llama.
 *   <LabPerformanceList people={[{ id, name, completed, merma, pctMerma }]} />
 */
export default function LabPerformanceList({ people = [] }) {

  if (!people.length) {
    return <p className="text-sm text-text-secondary">Sin información disponible</p>;
  }

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 gap-y-3">

      <span />
      <span className="text-right text-xs font-semibold uppercase tracking-wide text-text-secondary">Terminados</span>
      <span className="text-right text-xs font-semibold uppercase tracking-wide text-text-secondary">Mermas</span>
      <span className="text-right text-xs font-semibold uppercase tracking-wide text-text-secondary">% Merma</span>

      {people.map((p) => (
        <Fragment key={p.id}>
          <span className="text-sm font-medium text-text-primary">{p.name}</span>
          <span className="text-right text-sm font-bold text-text-primary">{p.completed}</span>
          <span className="text-right text-sm font-semibold" style={{ color: p.merma > 0 ? CHART_COLORS.error : undefined }}>
            {p.merma}
          </span>
          <span className="text-right text-sm font-semibold" style={{ color: p.pctMerma > 0 ? CHART_COLORS.error : undefined }}>
            {p.pctMerma}%
          </span>
        </Fragment>
      ))}

    </div>
  );

}
