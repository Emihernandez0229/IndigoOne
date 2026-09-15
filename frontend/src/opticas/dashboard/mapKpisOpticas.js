import { ROLES } from "../../shared/security/roles";

const currency = (value) =>
  `$${Number(value ?? 0).toLocaleString("es-MX")}`;

export function mapKpisToCards(role, kpis) {

  if (!kpis) {
    return [];
  }

  switch (role) {


    case ROLES.OPTICA_DUENO:
      return [
        { id: "sucursalesActivas", type: "branches", title: "Sucursales activas", value: String(kpis.sucursalesActivas ?? 0) },
        { id: "ventasHoy", type: "sales", title: "Ventas hoy", value: currency(kpis.ventasHoy) },
        { id: "cantidadVentasHoy", type: "orders", title: "Ventas realizadas hoy", value: String(kpis.cantidadVentasHoy ?? 0) },
        { id: "ordenesLaboratorio", type: "laboratory", title: "Órdenes a laboratorio", value: String(kpis.ordenesLaboratorio ?? 0) },
      ];

    case ROLES.OPTICA_ENCARGADO:
      return [
        { id: "ventasHoy", type: "sales", title: "Ventas hoy", value: currency(kpis.ventasHoy) },
        { id: "cantidadVentasHoy", type: "orders", title: "Ventas realizadas hoy", value: String(kpis.cantidadVentasHoy ?? 0) },
        { id: "empleados", type: "team", title: "Personal activo", value: String(kpis.empleados ?? 0) },
        { id: "ordenesLaboratorio", type: "laboratory", title: "Órdenes a laboratorio", value: String(kpis.ordenesLaboratorio ?? 0) },
      ];

    case ROLES.OPTICA_EMPLEADO:
      return [
        { id: "ventas", type: "orders", title: "Mis ventas", value: String(kpis.ventas ?? 0) },
        { id: "totalVentas", type: "sales", title: "Total vendido", value: currency(kpis.totalVentas) },
        { id: "ordenesLaboratorio", type: "laboratory", title: "Órdenes a laboratorio", value: String(kpis.ordenesLaboratorio ?? 0) },
      ];

    default:
      return [];
  }

}
