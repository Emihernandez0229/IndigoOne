import { Check } from "lucide-react";


function formatDateTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}


function buildJobSteps(job) {
  return [
    { label: "Trabajo ingresado", time: job.entryAt },
    { label: "Aceptado por laboratorio", time: job.acceptedAt },
    { label: "En proceso", time: job.processingAt },
    { label: "Terminado", time: job.completedAt },
    { label: "Entregado", time: job.deliveredAt },
  ];
}


/**
 * Linea de tiempo compartida entre el panel de detalle de Dueño/Gerente
 * (solo lectura) y el del Empleado de Laboratorio (con acciones).
 */
export default function JobTimeline({ job }) {
  const steps = buildJobSteps(job);

  return (
    <div className="space-y-5">
      {steps.map((step, index) => {
        const done = Boolean(step.time);
        const isLast = index === steps.length - 1;

        return (
          <div key={step.label} className="relative flex gap-3 pb-1">
            {!isLast && (
              <span className={`absolute left-[11px] top-6 h-full w-0.5 ${done ? "bg-success" : "bg-gray-200"}`} />
            )}

            <span
              className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                done ? "bg-success text-white" : "bg-gray-200 text-text-secondary"
              }`}
            >
              {done && <Check className="h-3.5 w-3.5" />}
            </span>

            <div>
              <p className={`text-sm font-medium ${done ? "text-text-primary" : "text-text-secondary"}`}>{step.label}</p>
              <p className="text-xs text-text-secondary">{formatDateTime(step.time) ?? "--:--"}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
