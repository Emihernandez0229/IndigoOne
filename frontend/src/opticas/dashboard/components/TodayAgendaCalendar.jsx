import { useMemo, useState } from "react";

import DashboardPanel from "../../../shared/dashboard/DashboardPanel";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

const TIPO_STYLES = {
  entrega: { label: "Entrega", bar: "bg-success", bg: "bg-success/10" },
  ajuste: { label: "Ajuste", bar: "bg-warning", bg: "bg-warning/10" },
  reparacion: { label: "Reparación", bar: "bg-warning", bg: "bg-warning/10" },
  consulta: { label: "Consulta", bar: "bg-indigo-primary", bg: "bg-indigo-light" },
};

// El motivo es texto libre (ver citas/constants.js), pero en la práctica
// casi siempre nombra el tipo de cita - se usa para agrupar visualmente
// sin inventar una categoría que no existe en el dato.
function tipoDeCita(reason) {
  const r = (reason ?? "").toLowerCase();
  if (r.includes("entrega")) return TIPO_STYLES.entrega;
  if (r.includes("reparaci")) return TIPO_STYLES.reparacion;
  if (r.includes("ajuste")) return TIPO_STYLES.ajuste;
  return TIPO_STYLES.consulta;
}

function formatHora(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}


/**
 * Calendario de solo lectura: mes actual con un punto bajo los días que
 * tienen citas. El listado de abajo no se muestra solo - aparece al dar
 * clic en el número de un día con citas, y se oculta si se vuelve a dar
 * clic en el mismo día. Pensado para el Dashboard del Dueño, no reemplaza
 * el módulo de Citas.
 */
export default function TodayAgendaCalendar({ citas = [], showBranch = false }) {

  const today = useMemo(() => new Date(), []);
  const [selectedDay, setSelectedDay] = useState(null);

  const monthLabel = today.toLocaleDateString("es-MX", { month: "short", year: "numeric" }).replace(".", "");

  const cells = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // getDay(): 0=domingo..6=sábado - se recorre para que la semana
    // empiece en lunes, como en el encabezado L M X J V S D.
    const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
    return [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
  }, [today]);

  const daysWithCitas = useMemo(() => {
    const set = new Set();
    citas.forEach((c) => {
      const date = new Date(c.dateTime);
      if (Number.isNaN(date.getTime())) return;
      if (date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth()) {
        set.add(date.getDate());
      }
    });
    return set;
  }, [citas, today]);

  const selectedDayCitas = useMemo(() => {
    if (!selectedDay) return [];
    return citas
      .filter((c) => {
        const date = new Date(c.dateTime);
        return !Number.isNaN(date.getTime())
          && date.getFullYear() === today.getFullYear()
          && date.getMonth() === today.getMonth()
          && date.getDate() === selectedDay;
      })
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  }, [citas, selectedDay, today]);

  const handleDayClick = (day) => {
    if (!daysWithCitas.has(day)) return;
    setSelectedDay((prev) => (prev === day ? null : day));
  };


  return (

    <DashboardPanel
      title="Agenda de hoy"
      action={<span className="text-sm capitalize text-text-secondary">{monthLabel}</span>}
      className="flex h-full flex-col"
    >

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-text-secondary">
        {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((day, idx) => {
          if (!day) return <div key={`blank-${idx}`} />;
          const isToday = day === today.getDate();
          const isSelected = day === selectedDay;
          const hasCitas = daysWithCitas.has(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayClick(day)}
              disabled={!hasCitas}
              className={`flex flex-col items-center py-1 ${hasCitas ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                  isToday ? "bg-indigo-primary font-semibold text-white" : "text-text-primary"
                } ${isSelected ? "ring-2 ring-indigo-primary ring-offset-1" : ""} ${hasCitas && !isToday ? "hover:bg-background" : ""}`}
              >
                {day}
              </span>
              <span className={`mt-0.5 h-1 w-1 rounded-full ${hasCitas ? "bg-indigo-primary" : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex-1 space-y-2 overflow-y-auto border-t border-gray-100 pt-4">
        {!selectedDay ? (
          <p className="text-sm text-text-secondary">Da clic en un día con citas para ver el detalle.</p>
        ) : (
          selectedDayCitas.map((c) => {
            const tipo = tipoDeCita(c.reason);
            return (
              <div key={c.id} className={`flex items-center gap-3 rounded-xl ${tipo.bg} py-2.5 pl-3 pr-4`}>
                <span className={`h-8 w-1 shrink-0 rounded-full ${tipo.bar}`} />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {tipo.label} · {c.patientName}{showBranch && c.branchName ? ` · ${c.branchName}` : ""}
                  </p>
                  <p className="text-xs text-text-secondary">{formatHora(c.dateTime)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

    </DashboardPanel>

  );

}
