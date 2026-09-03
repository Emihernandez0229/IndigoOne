import {
  LayoutDashboard,
  Building2,
  Users,
  ShoppingCart,
  FlaskConical,
  FileText,
} from "lucide-react";


/**
 * Menu lateral del modulo INDIGO.
 *
 * Forma de cada item:
 *   { label, path, icon, permission }   -> enlace
 *   { section: "Texto" }                -> separador
 *
 * `permission` null  => visible siempre.
 * El filtrado por permisos lo hace filterMenuByPermissions() en el Sidebar.
 */
export const indigoNavigation = [

  {
    label: "Dashboard",
    path: "/indigo/dashboard",
    icon: LayoutDashboard,
    permission: null,
  },

  {
    label: "Sucursales",
    path: "/indigo/sucursales",
    icon: Building2,
    permission: "branch.view",
  },

  {
    label: "Usuarios",
    path: "/indigo/usuarios",
    icon: Users,
    permission: "user.view",
  },

  {
    label: "Ventas",
    path: "/indigo/ventas",
    icon: ShoppingCart,
    permission: "sales.view",
  },

  {
    label: "Laboratorio",
    path: "/indigo/laboratorio",
    icon: FlaskConical,
    permission: "laboratory.job.view",
  },

  {
    label: "Reportes",
    path: "/indigo/reportes",
    icon: FileText,
    permission: "reports.branch",
  },

];
