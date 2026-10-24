/**
 * Pastilla de prioridad para Ventas: Normal (azul) / Urgente (rosa/rojo).
 */
export default function PriorityBadge({ priority }) {
  if (priority === "urgente") {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-600">
        Urgente
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
      Normal
    </span>
  );
}
