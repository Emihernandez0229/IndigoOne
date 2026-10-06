import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  CalendarDays,
  Users,
  UserCog,
  Building2,
  FlaskConical,
  Glasses,
  BarChart3,
  PackageSearch,
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
    label: "Óptica",
    path: "/opticas/optica",
    icon: Store,
    permission: "optica.settings.view",
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
    label: "Clientes",
    path: "/opticas/pacientes",
    icon: Users,
    permission: "optica.patient.view",
  },

  {
    label: "Citas",
    path: "/opticas/citas",
    icon: CalendarDays,
    permission: "optica.appointment.manage",
  },

  {
    label: "Ventas",
    path: "/opticas/ventas",
    icon: ShoppingCart,
    permission: "optica.sales.view",
  },

  {
    label: "Laboratorio",
    path: "/opticas/laboratorio",
    icon: FlaskConical,
    permission: "optica.lab.view",
  },

  {
    label: "Productos y servicios",
    path: "/opticas/productos-servicios",
    icon: PackageSearch,
    permission: "optica.catalog.view",
  },

  {
    label: "Inventario",
    path: "/opticas/inventario",
    icon: Glasses,
    permission: "optica.inventory.view",
  },

  {
    label: "Reportes",
    path: "/opticas/reportes",
    icon: BarChart3,
    permission: "optica.reports.view",
  },

];
