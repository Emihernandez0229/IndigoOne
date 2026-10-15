import { LayoutDashboard, UserRound, ClipboardList } from "lucide-react";


/**
 * Menu lateral exclusivo del Empleado de Ventas: su interfaz es mas
 * sencilla que la del resto de los roles de Indigo (sin Sucursales,
 * Personal, Laboratorio general, Inventario ni Reportes).
 */
export const salesNavigation = [

  {
    label: "Inicio",
    path: "/indigo/dashboard",
    icon: LayoutDashboard,
    permission: null,
  },

  {
    label: "Clientes",
    path: "/indigo/clientes",
    icon: UserRound,
    permission: "client.view",
  },

  {
    label: "Trabajos u órdenes",
    path: "/indigo/trabajos",
    icon: ClipboardList,
    permission: "laboratory.job.view",
  },

];
