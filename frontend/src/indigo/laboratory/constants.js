
export const LAB_STATUSES = [
  { value: "pending", label: "Pendiente" },
  { value: "processing", label: "En proceso" },
  { value: "completed", label: "Terminado" },
  { value: "warranty", label: "Garantía" },
  { value: "loss", label: "Merma" },
];

export const LAB_STATUS_LABELS = Object.fromEntries(
  LAB_STATUSES.map((s) => [s.value, s.label])
);

export const SERVICE_TYPES = [
  { value: "bisel", label: "Bisel" },
  { value: "montaje", label: "Montaje" },
  { value: "tinte", label: "Tinte" },
  { value: "otro", label: "Otro" },
];

export const SERVICE_TYPE_LABELS = Object.fromEntries(
  SERVICE_TYPES.map((s) => [s.value, s.label])
);

export const PERIODS = [
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "year", label: "Este año" },
  { value: "custom", label: "Rango personalizado" },
];

export const PRIORITIES = [
  { value: "urgent", label: "Urgente" },
  { value: "normal", label: "Normal" },
];

export const BISEL_TYPES = [
  { value: "Manual", label: "Manual" },
  { value: "Automático", label: "Automático" },
  { value: "Ranurado", label: "Ranurado" },
  { value: "Perforado", label: "Perforado" },
];

// Rojo especifico para marcar urgencia/merma en todo el modulo de
// Laboratorio (tabla, badges, detalle) - no es el --color-error del tema.
export const URGENT_COLOR = "#FF6666";
