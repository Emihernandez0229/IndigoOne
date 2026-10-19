export const PERIODS = [
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "year", label: "Este año" },
  { value: "custom", label: "Rango personalizado" },
];

export const LAB_STATUSES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "listo", label: "Listo" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelada", label: "Cancelada" },
];

// Transiciones permitidas desde cada estado - una orden de laboratorio no
// se puede cancelar.
export const STATUS_TRANSITIONS = {
  pendiente: [
    { value: "en_proceso", label: "Iniciar proceso", variant: "secondary" },
  ],
  en_proceso: [
    { value: "listo", label: "Marcar como lista", variant: "secondary" },
  ],
  listo: [
    { value: "entregado", label: "Marcar como entregada", variant: "secondary" },
  ],
  entregado: [],
  cancelada: [],
};

export const EMPTY_RECETA = {
  odEsfera: "",
  odCilindro: "",
  odEje: "",
  oiEsfera: "",
  oiCilindro: "",
  oiEje: "",
  adicion: "",
  dp: "",
};
