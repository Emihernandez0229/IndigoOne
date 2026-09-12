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
        { id: "sucursalesActivas", type: "branches", title: "Sucursales activas", value: String(kpis.sucursalesActivas ?? 0) },
        { id: "ventasHoy", type: "sales", title: "Ventas hoy", value: currency(kpis.ventasHoy) },
        { id: "cantidadVentasHoy", type: "orders", title: "Ventas realizadas hoy", value: String(kpis.cantidadVentasHoy ?? 0) },
        { id: "ordenesLaboratorio", type: "laboratory", title: "Órdenes a laboratorio", value: String(kpis.ordenesLaboratorio ?? 0) },
      ];

    case ROLES.INDIGO_GERENTE_SUCURSAL:
      return [
        { id: "ventasHoy", type: "sales", title: "Ventas hoy", value: currency(kpis.ventasHoy) },
        { id: "cantidadVentasHoy", type: "orders", title: "Ventas realizadas hoy", value: String(kpis.cantidadVentasHoy ?? 0) },
        { id: "empleados", type: "team", title: "Empleados activos", value: String(kpis.empleados ?? 0) },
        { id: "ordenesLaboratorio", type: "laboratory", title: "Órdenes a laboratorio", value: String(kpis.ordenesLaboratorio ?? 0) },
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
