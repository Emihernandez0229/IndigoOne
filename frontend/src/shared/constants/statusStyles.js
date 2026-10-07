/**
 * Estilos de estado compartidos para Badge / StatusBadge.
 * Cubre estados de laboratorio y de ventas.
 */
export const statusStyles = {

  urgent: {
    label: "Urgente",
    className: "bg-error/10 text-error",
  },

  pending: {
    label: "Pendiente",
    className: "bg-warning/10 text-warning",
  },

  accepted: {
    label: "Aceptado",
    className: "bg-indigo-light text-indigo-primary",
  },

  processing: {
    label: "En proceso",
    className: "bg-indigo-light text-indigo-primary",
  },

  ready: {
    label: "Listo",
    className: "bg-success/10 text-success",
  },

  completed: {
    label: "Completado",
    className: "bg-success/10 text-success",
  },

  cancelled: {
    label: "Cancelado",
    className: "bg-error/10 text-error",
  },

  // Estado de sucursales / usuarios
  active: {
    label: "Activa",
    className: "bg-success/10 text-success",
  },

  inactive: {
    label: "Inactiva",
    className: "bg-gray-200 text-text-secondary",
  },

  // Estado de inventario (armazones)
  available: {
    label: "Disponible",
    className: "bg-success/10 text-success",
  },

  low_stock: {
    label: "Bajo stock",
    className: "bg-warning/10 text-warning",
  },

  out_of_stock: {
    label: "Agotado",
    className: "bg-error/10 text-error",
  },

  // Estado de citas
  programada: {
    label: "Programada",
    className: "bg-warning/10 text-warning",
  },

  confirmada: {
    label: "Confirmada",
    className: "bg-indigo-light text-indigo-primary",
  },

  atendida: {
    label: "Atendida",
    className: "bg-success/10 text-success",
  },

  cancelada: {
    label: "Cancelada",
    className: "bg-error/10 text-error",
  },

  no_asistio: {
    label: "No asistió",
    className: "bg-gray-200 text-text-secondary",
  },

  // Estado de ventas
  completada: {
    label: "Completada",
    className: "bg-success/10 text-success",
  },

  // Estado de ordenes de laboratorio
  pendiente: {
    label: "Pendiente",
    className: "bg-warning/10 text-warning",
  },

  en_proceso: {
    label: "En proceso",
    className: "bg-indigo-light text-indigo-primary",
  },

  listo: {
    label: "Listo",
    className: "bg-success/10 text-success",
  },

  entregado: {
    label: "Entregado",
    className: "bg-success/10 text-success",
  },

};
