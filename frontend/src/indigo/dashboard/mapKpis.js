import { ROLES } from "../../shared/security/roles";

const currency = (value) =>
  `$${Number(value ?? 0).toLocaleString("es-MX")}`;

/**
 * El backend regresa los KPIs como un objeto plano de estadisticas
 * (ej. { ventasHoy, ordenesLaboratorio }). DashboardLayout espera un
 * arreglo de tarjetas [{ id, type, title, value }] para poder
 * mostrarlas, así que aquí se traduce uno al otro según el rol.
 */
export function mapKpisToCards(role, kpis) {

  if (!kpis) {
    return [];
  }

  switch (role) {

    case ROLES.INDIGO_SUPER_USUARIO:
    case ROLES.INDIGO_DUENO:
      return [
        {
          id: "sucursalesActivas", type: "branches", title: "Sucursales activas",
          value: String(kpis.sucursalesActivas ?? 0), color: "blue",
          description: "Operando",
        },
        {
          id: "ventasHoy", type: "sales", title: "Ventas hoy",
          value: currency(kpis.ventasHoy), color: "pink",
          description: "En todas las sucursales",
        },
        {
          id: "clientes", type: "patients", title: "Clientes",
          value: String(kpis.clientes ?? 0), color: "purple",
          description: `Activos: ${kpis.clientesActivos ?? 0}  ·  Inactivos: ${kpis.clientesInactivos ?? 0}`,
        },
        { id: "ordenesLaboratorio", type: "laboratory", title: "Órdenes a laboratorio", value: String(kpis.ordenesLaboratorio ?? 0), color: "orange" },
      ];

    case ROLES.INDIGO_GERENTE_SUCURSAL:
    case ROLES.INDIGO_SUBGERENTE:
      return [
        {
          id: "clientes", type: "patients", title: "Clientes",
          value: String(kpis.clientes ?? 0), color: "purple",
          description: `Activos: ${kpis.clientesActivos ?? 0}  ·  Inactivos: ${kpis.clientesInactivos ?? 0}`,
        },
        { id: "empleados", type: "team", title: "Empleados", value: String(kpis.empleados ?? 0), color: "blue" },
        { id: "productosDisponibles", type: "products", title: "Productos disponibles", value: String(kpis.productosDisponibles ?? 0), color: "orange" },
        { id: "ventasHoy", type: "sales", title: "Ventas hoy", value: currency(kpis.ventasHoy), color: "pink" },
      ];

    case ROLES.INDIGO_EMPLEADO_VENTAS:
      return [
        { id: "ventas", type: "orders", title: "Mis ventas", value: String(kpis.ventas ?? 0) },
        { id: "totalVentas", type: "sales", title: "Total vendido", value: currency(kpis.totalVentas) },
        { id: "ordenesLaboratorio", type: "laboratory", title: "Órdenes a laboratorio", value: String(kpis.ordenesLaboratorio ?? 0) },
      ];

    case ROLES.INDIGO_EMPLEADO_LABORATORIO:
      return [
        { id: "pendientes", type: "orders", title: "Pendientes", value: String(kpis.pendientes ?? 0) },
        { id: "enProceso", type: "laboratory", title: "En proceso", value: String(kpis.enProceso ?? 0) },
        { id: "total", type: "orders", title: "Total", value: String(kpis.total ?? 0) },
      ];

    default:
      return [];
  }

}
