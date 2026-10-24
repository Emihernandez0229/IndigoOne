import { Glasses, Sparkles } from "lucide-react";
import { ICON_TONES } from "../constants";


export function OpticaCardHeader({ icon: Icon, title, description, tone = "blue" }) {
  const t = ICON_TONES[tone] ?? ICON_TONES.blue;
  return (
    <div className="relative mb-5 flex items-start gap-3">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.bg}`}>
        <Icon className={`h-5 w-5 ${t.text}`} />
      </span>
      <div>
        <h3 className="text-base font-bold text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </div>
  );
}


export function OpticaFieldChip({ icon: Icon, label, value, optional, tone = "blue" }) {
  const t = ICON_TONES[tone] ?? ICON_TONES.blue;
  return (
    <div className="flex items-start gap-3">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.bg}`}>
        <Icon className={`h-5 w-5 ${t.text}`} />
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm text-text-secondary">
          {label}
          {optional && <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">Opcional</span>}
        </p>
        <p className="truncate text-sm font-bold text-text-primary">{value || "Sin registrar"}</p>
      </div>
    </div>
  );
}


export function OpticaCardDecoration() {
  return (
    <>
      <Glasses strokeWidth={1} className="pointer-events-none absolute -bottom-14 -right-14 h-64 w-64 text-indigo-light" />
      <Glasses strokeWidth={1} className="pointer-events-none absolute -bottom-6 right-40 h-32 w-32 text-indigo-light/70" />
      <Sparkles className="pointer-events-none absolute right-16 top-8 h-6 w-6 text-indigo-light" />
      <Sparkles className="pointer-events-none absolute right-36 top-24 h-4 w-4 text-indigo-light" />
    </>
  );
}
