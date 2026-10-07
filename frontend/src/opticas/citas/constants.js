export const CITA_STATUSES = [
  { value: "programada", label: "Programada" },
  { value: "confirmada", label: "Confirmada" },
  { value: "atendida", label: "Atendida" },
  { value: "cancelada", label: "Cancelada" },
  { value: "no_asistio", label: "No asistió" },
];

// Transiciones permitidas desde cada estado (misma regla que el back propone).
export const STATUS_TRANSITIONS = {
  programada: [
    { value: "confirmada", label: "Confirmar", variant: "secondary" },
    { value: "cancelada", label: "Cancelar cita", variant: "danger" },
    { value: "no_asistio", label: "Marcar no asistió", variant: "danger" },
  ],
  confirmada: [
    { value: "atendida", label: "Marcar como atendida", variant: "secondary" },
    { value: "cancelada", label: "Cancelar cita", variant: "danger" },
    { value: "no_asistio", label: "Marcar no asistió", variant: "danger" },
  ],
  atendida: [],
  cancelada: [],
  no_asistio: [],
};

// Solo se puede editar fecha/motivo mientras la cita no llegó a un estado final.
export const EDITABLE_STATUSES = ["programada", "confirmada"];
