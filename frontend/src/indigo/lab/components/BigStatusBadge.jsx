import { Clock, Settings, CheckCircle2, AlertTriangle } from "lucide-react";
import { statusStyles } from "../../../shared/constants/statusStyles";
import { LAB_STATUS_LABELS } from "../../laboratory/constants";


const ICONS = {
  pending: Clock,
  processing: Settings,
  completed: CheckCircle2,
  loss: AlertTriangle,
};


/**
 * Igual que StatusBadge pero mas grande, para el modulo de Trabajos del
 * Empleado de Laboratorio donde el estado necesita verse de un vistazo.
 */
export default function BigStatusBadge({ status }) {
  const style = statusStyles[status] ?? statusStyles.pending;
  const Icon = ICONS[status] ?? Clock;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold ${style.className}`}>
      <Icon className="h-4 w-4" />
      {LAB_STATUS_LABELS[status] ?? status}
    </span>
  );
}
