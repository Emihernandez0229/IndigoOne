import { Calendar } from "lucide-react";
import Input from "../../../shared/components/Input";

const MODES = [
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "range", label: "Rango de fechas" },
];


export default function PeriodSelector({
  mode,
  onModeChange,
  rangeLabel,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}) {

  return (
    <div className="flex flex-wrap items-center gap-3">

      <div className="inline-flex rounded-xl border border-gray-200 bg-surface p-1">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => onModeChange(m.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              mode === m.value
                ? "bg-indigo-primary text-white"
                : "text-text-secondary hover:bg-background"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "range" ? (
        <div className="flex items-center gap-2">
          <Input type="date" value={customFrom} onChange={(e) => onCustomFromChange(e.target.value)} />
          <span className="text-text-secondary">–</span>
          <Input type="date" value={customTo} onChange={(e) => onCustomToChange(e.target.value)} />
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-surface px-4 py-2 text-sm text-text-secondary">
          <Calendar className="h-4 w-4" />
          {rangeLabel}
        </div>
      )}

    </div>
  );

}
