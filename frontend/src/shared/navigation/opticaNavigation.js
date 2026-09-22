import {
  LayoutDashboard,
  ShoppingCart,
  CalendarDays,
  Users,
  UserCog,
  Building2,
  FlaskConical,
  Glasses,
} from "lucide-react";


/**
 * Menu lateral del modulo OPTICAS.
 * Misma forma que indigoNavigation.
 */
export const opticaNavigation = [

  {
    label: "Dashboard",
    path: "/opticas/dashboard",
    icon: LayoutDashboard,
    permission: null,
  },

  {
    label: "Sucursales",
    path: "/opticas/sucursales",
    icon: Building2,
    permission: "optica.branch.view",
  },

  {
    label: "Usuarios",
    path: "/opticas/usuarios",
    icon: UserCog,
    permission: "optica.user.view",
  },

  {
    label: "Punto de venta",
    path: "/opticas/ventas",
    icon: ShoppingCart,
    permission: "optica.sales.view",
  },

  {
    label: "Citas",
    path: "/opticas/citas",
    icon: CalendarDays,
    permission: "optica.appointment.manage",
  },

  {
    label: "Pacientes",
    path: "/opticas/pacientes",
    icon: Users,
    permission: "optica.patient.view",
  },

  {
    label: "Laboratorio",
    path: "/opticas/laboratorio",
    icon: FlaskConical,
    permission: "optica.sales.view",
  },

  {
    label: "Inventario",
    path: "/opticas/inventario",
    icon: Glasses,
    permission: "optica.inventory.view",
  },

];
