import { ROLES } from "../../../shared/security/roles";
export async function getIndigoDashboardData(role) {

  await delay(300);

  switch (role) {

    case ROLES.INDIGO_OWNER:
      return OWNER_MOCK;

    case ROLES.INDIGO_BRANCH_MANAGER:
      return BRANCH_MANAGER_MOCK;

    case ROLES.INDIGO_SALES:
      return SALES_MOCK;

    case ROLES.INDIGO_LAB:
      return LAB_MOCK;

    default:
      return {};

  }

}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const OWNER_MOCK = {

    branches: [
      { id: 1, name: "Sucursal Centro" },
      { id: 2, name: "Sucursal Norte" },
      { id: 3, name: "Sucursal Sur" },
    ],

    kpis: [
      { id: "sales", type: "sales", title: "Ventas", value: "$182,400", description: "Este mes", trend: "+12.4%", trendDirection: "up" },
      { id: "customers", type: "customers", title: "Clientes", value: "1,240", description: "Nuevos: 86", trend: "+6.1%", trendDirection: "up" },
      { id: "laboratory", type: "laboratory", title: "Trabajos laboratorio", value: "312", description: "En producción", trend: "-3.2%", trendDirection: "down" },
      { id: "branches", type: "branches", title: "Sucursales", value: "3", description: "Activas" },
    ],

    salesByBranch: [
      { name: "Centro", sales: 82400 },
      { name: "Norte", sales: 61200 },
      { name: "Sur", sales: 38800 },
    ],

    laboratory: [
      { id: 1, order: "LAB-1042", customer: "Sucursal Centro", status: "urgent", priority: "urgent" },
      { id: 2, order: "LAB-1043", customer: "Sucursal Norte", status: "processing", priority: "normal" },
      { id: 3, order: "LAB-1044", customer: "Sucursal Sur", status: "pending", priority: "normal" },
    ],

    reports: {
      sales: "$182,400",
      customers: "1,240",
      jobs: "312",
    },

};

const BRANCH_MANAGER_MOCK = {

    branchName: "Sucursal Centro",

    kpis: [
      { id: "sales", type: "sales", title: "Ventas sucursal", value: "$82,400", description: "Este mes", trend: "+9.7%", trendDirection: "up" },
      { id: "customers", type: "customers", title: "Clientes", value: "486", description: "Nuevos: 34", trend: "+4.0%", trendDirection: "up" },
      { id: "team", type: "team", title: "Equipo", value: "8", description: "Empleados activos" },
      { id: "laboratory", type: "laboratory", title: "Trabajos laboratorio", value: "54", description: "En producción" },
    ],

    salesByEmployee: [
      { name: "A. Ramírez", sales: 24800 },
      { name: "L. Gómez", sales: 19600 },
      { name: "J. Torres", sales: 17200 },
      { name: "M. Díaz", sales: 20800 },
    ],

    team: [
      { id: 1, name: "Ana Ramírez", role: "Ventas", sales: "$24,800" },
      { id: 2, name: "Luis Gómez", role: "Ventas", sales: "$19,600" },
      { id: 3, name: "Julia Torres", role: "Ventas", sales: "$17,200" },
    ],

    laboratory: [
      { id: 1, order: "LAB-2087", customer: "Carlos Pérez", status: "urgent", priority: "urgent" },
      { id: 2, order: "LAB-2088", customer: "Diana Ruiz", status: "processing", priority: "normal" },
      { id: 3, order: "LAB-2089", customer: "Óscar Lima", status: "pending", priority: "normal" },
    ],

};

const SALES_MOCK = {

    kpis: [
      { id: "sales", type: "sales", title: "Mis ventas", value: "$12,480", description: "Este mes", trend: "+15.2%", trendDirection: "up" },
      { id: "orders", type: "orders", title: "Tickets", value: "38", description: "Promedio $328" },
      { id: "customers", type: "customers", title: "Clientes nuevos", value: "12", description: "Este mes", trend: "+2", trendDirection: "up" },
      { id: "laboratory", type: "laboratory", title: "Órdenes a laboratorio", value: "9", description: "Creadas por mí" },
    ],

    recentSales: [
      { id: 1, client: "Juan Hernández", amount: "$850", status: "completed" },
      { id: 2, client: "Laura Gómez", amount: "$1,200", status: "processing" },
      { id: 3, client: "Pedro Ruiz", amount: "$540", status: "pending" },
      { id: 4, client: "Sofía Marín", amount: "$980", status: "completed" },
    ],

    myLabOrders: [
      { id: 1, order: "LAB-3120", status: "processing" },
      { id: 2, order: "LAB-3121", status: "pending" },
      { id: 3, order: "LAB-3122", status: "ready" },
    ],

};

const LAB_MOCK = {

    kpis: [
      { id: "pending", type: "orders", title: "Pendientes", value: "18", description: "Sin aceptar" },
      { id: "urgent", type: "laboratory", title: "Urgentes", value: "4", description: "Prioridad alta", trend: "+1", trendDirection: "down" },
      { id: "processing", type: "orders", title: "En proceso", value: "11", description: "Aceptados" },
      { id: "done", type: "orders", title: "Completados hoy", value: "7", description: "Entregados" },
    ],

    queue: [
      { id: 1, order: "LAB-4501", customer: "Sucursal Centro", status: "urgent", priority: "urgent" },
      { id: 2, order: "LAB-4502", customer: "Sucursal Norte", status: "pending", priority: "normal" },
      { id: 3, order: "LAB-4503", customer: "Sucursal Sur", status: "processing", priority: "normal" },
      { id: 4, order: "LAB-4504", customer: "Sucursal Centro", status: "pending", priority: "urgent" },
      { id: 5, order: "LAB-4505", customer: "Sucursal Norte", status: "processing", priority: "normal" },
    ],

};
