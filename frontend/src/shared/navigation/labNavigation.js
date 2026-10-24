import { LayoutDashboard, ClipboardList, AlertTriangle } from "lucide-react";


/**
 * Menu lateral exclusivo del Empleado de Laboratorio: su interfaz esta
 * enfocada en el seguimiento de ordenes, no necesita el resto de modulos.
 */
export const labNavigation = [

  {
    label: "Inicio",
    path: "/indigo/dashboard",
    icon: LayoutDashboard,
    permission: null,
  },

  {
    label: "Trabajos",
    path: "/indigo/trabajos",
    icon: ClipboardList,
    permission: "laboratory.job.view",
  },

  {
    label: "Mermas",
    path: "/indigo/mermas",
    icon: AlertTriangle,
    permission: "laboratory.job.view",
  },

];
