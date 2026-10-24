// Estado del trabajo - independiente de si ya se pago o no (ver
// PAYMENT_STATUSES).
export const SALE_STATUSES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
];

// Transiciones permitidas desde cada estado - mismo patron que
// laboratorio/constants.js. Cancelar es aparte (solo desde "pendiente").
export const STATUS_TRANSITIONS = {
  pendiente: [
    { value: "en_proceso", label: "Iniciar proceso", variant: "secondary" },
  ],
  en_proceso: [
    { value: "completada", label: "Marcar como completada", variant: "secondary" },
  ],
  completada: [],
  cancelada: [],
};

// Pagos - separado del estado del trabajo: una venta puede estar
// "en proceso" y ya tener el pago liquidado, o "completada" y seguir en
// adeudo.
export const PAYMENT_STATUSES = [
  { value: "liquidada", label: "Liquidada" },
  { value: "en_adeudo", label: "En adeudo" },
];

export const WORK_TYPES = [
  { value: "venta_directa", label: "Venta directa" },
  { value: "trabajo_interno", label: "Trabajo interno" },
  { value: "orden_laboratorio", label: "Orden de laboratorio" },
];

export const WORK_TYPE_INFO = {
  venta_directa: {
    label: "Venta directa",
    description: "Sin orden de trabajo ni solicitud de laboratorio.",
  },
  trabajo_interno: {
    label: "Trabajo interno",
    description: "Montaje de lentes, ajuste de armazón, preparación o revisión.",
  },
  orden_laboratorio: {
    label: "Orden de laboratorio · Índigo",
    description: "Solicitar fabricación, tallado u otro proceso técnico al laboratorio.",
  },
};

export const INTERNAL_WORK_SUBTYPES = [
  { value: "consultas", label: "Consultas" },
  { value: "ajuste_alineacion", label: "Ajuste y alineación" },
  { value: "reparaciones", label: "Reparaciones" },
];

export const LAB_WORK_SUBTYPES = [
  { value: "fabricacion_lentes", label: "Fabricación de lentes" },
  { value: "tallado_montaje", label: "Tallado y montaje especializado" },
  { value: "otro_proceso", label: "Otro proceso técnico" },
];

export const PRIORITIES = [
  { value: "normal", label: "Normal" },
  { value: "urgente", label: "Urgente" },
];

export const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "debito", label: "Débito" },
  { value: "credito", label: "Crédito" },
  { value: "transferencia", label: "Transferencia" },
  { value: "otro", label: "Otro" },
];

export const IVA_RATE = 0.16;
