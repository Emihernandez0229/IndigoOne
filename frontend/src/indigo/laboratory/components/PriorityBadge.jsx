import { URGENT_COLOR } from "../constants";


/**
 * Etiqueta de prioridad (Urgente/Normal) para trabajos de laboratorio y
 * mermas. Urgente usa el rojo claro especifico #FF6666 pedido para todo
 * el modulo, no el --color-error del tema.
 */
export default function PriorityBadge({ urgent }) {

  if (urgent) {
    return (
      <span
        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
        style={{ backgroundColor: `${URGENT_COLOR}1A`, color: URGENT_COLOR }}
      >
        Urgente
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-text-secondary">
      Normal
    </span>
  );

}
