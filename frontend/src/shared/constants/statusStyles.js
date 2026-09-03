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

};
