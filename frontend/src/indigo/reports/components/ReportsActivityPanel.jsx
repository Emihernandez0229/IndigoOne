import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { CHART_COLORS } from "../../../shared/charts/chartTheme";
import LabPerformanceList from "./LabPerformanceList";
import JobDetailTable from "./JobDetailTable";


function NameTabs({ items, activeId, onSelect, renderBadge }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {items.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect(p.id)}
          className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
            p.id === activeId
              ? "border-indigo-primary bg-indigo-primary text-white"
              : "border-gray-200 bg-surface text-text-secondary hover:bg-background"
          }`}
        >
          {p.name}
          {renderBadge && <span className="ml-1.5 opacity-80">{renderBadge(p)}</span>}
        </button>
      ))}
    </div>
  );
}


/**
 * "Actividad del equipo" (Reportes - Gerente/Subgerente). Por default
 * muestra el resumen en 2 columnas (Ventas / Laboratorio); el "Ver más" de
 * cada columna cambia la tarjeta entera a una pantalla de detalle de ancho
 * completo, con los nombres como botones arriba y la tabla del
 * seleccionado abajo.
 */
export default function ReportsActivityPanel({ salesSummary = [], salesDetail = [], labSummary = [], labDetail = [] }) {

  const [view, setView] = useState("summary");
  const [selectedSalesId, setSelectedSalesId] = useState(null);
  const [selectedLabId, setSelectedLabId] = useState(null);

  const maxSales = Math.max(...salesSummary.map((s) => s.count), 1);

  const activeSalesPerson = salesDetail.find((p) => p.id === selectedSalesId) ?? salesDetail[0] ?? null;
  const activeLabPerson = labDetail.find((p) => p.id === selectedLabId) ?? labDetail[0] ?? null;

  if (view === "sales") {
    return (
      <section className="rounded-2xl border border-[#1F75FE]/30 bg-[#1F75FE]/10 p-5">

        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <button type="button" onClick={() => setView("summary")} className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-primary hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </button>
            <h2 className="text-base font-semibold text-text-primary">Ventas · Detalle por vendedor</h2>
          </div>
        </div>

        {salesDetail.length === 0 ? (
          <p className="text-sm text-text-secondary">Sin información disponible</p>
        ) : (
          <>
            <NameTabs
              items={salesDetail}
              activeId={activeSalesPerson?.id}
              onSelect={setSelectedSalesId}
              renderBadge={(p) => `(${p.jobs.length})`}
            />
            {activeSalesPerson && <JobDetailTable jobs={activeSalesPerson.jobs} />}
          </>
        )}

      </section>
    );
  }

  if (view === "lab") {
    return (
      <section className="rounded-2xl border border-gray-200 bg-surface p-5">

        <div className="mb-5">
          <button type="button" onClick={() => setView("summary")} className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <h2 className="text-base font-semibold text-text-primary">Laboratorio · Detalle por laboratorista</h2>
        </div>

        {labDetail.length === 0 ? (
          <p className="text-sm text-text-secondary">Sin información disponible</p>
        ) : (
          <>
            <NameTabs
              items={labDetail}
              activeId={activeLabPerson?.id}
              onSelect={setSelectedLabId}
              renderBadge={(p) => `(${p.completedJobs.length + p.mermaJobs.length})`}
            />

            {activeLabPerson && (
              <div className="space-y-5">
                {activeLabPerson.completedJobs.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-success">Terminados ({activeLabPerson.completedJobs.length})</p>
                    <JobDetailTable jobs={activeLabPerson.completedJobs} showStatus={false} />
                  </div>
                )}
                {activeLabPerson.mermaJobs.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-error">Mermas ({activeLabPerson.mermaJobs.length})</p>
                    <JobDetailTable jobs={activeLabPerson.mermaJobs} showStatus={false} />
                  </div>
                )}
                {activeLabPerson.completedJobs.length === 0 && activeLabPerson.mermaJobs.length === 0 && (
                  <p className="text-sm text-text-secondary">Sin trabajos en el periodo seleccionado.</p>
                )}
              </div>
            )}
          </>
        )}

      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-surface p-5">

      <h2 className="mb-5 text-base font-semibold text-text-primary">Actividad del equipo</h2>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Ventas · Trabajos registrados</p>
            <button type="button" onClick={() => setView("sales")} className="shrink-0 text-sm font-medium text-indigo-primary hover:underline">
              Ver más →
            </button>
          </div>

          {salesSummary.length === 0 ? (
            <p className="text-sm text-text-secondary">Sin información disponible</p>
          ) : (
            <div className="space-y-3">
              {salesSummary.map((s) => (
                <div key={s.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-text-primary">{s.name}</span>
                    <span className="font-semibold text-text-secondary">{s.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(s.count / maxSales) * 100}%`, backgroundColor: CHART_COLORS.secondary }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Laboratorio</p>
            <button type="button" onClick={() => setView("lab")} className="shrink-0 text-sm font-medium text-indigo-primary hover:underline">
              Ver más →
            </button>
          </div>

          <LabPerformanceList people={labSummary} />
        </div>

      </div>

    </section>
  );

}
