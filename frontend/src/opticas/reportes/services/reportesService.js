import { httpClient } from "../../../shared/api/httpClient";


function pad(n) {
  return String(n).padStart(2, "0");
}

// El back pide fecha-hora ISO con zona horaria (z.iso.datetime({offset:true})
// en reportes.schema.js) - distinto a Consultas/Citas que usan solo
// YYYY-MM-DD. `dateFrom`/`dateTo` del front son fechas sueltas (del
// <input type="date">); aqui se convierten a inicio/fin de dia en la zona
// local de quien usa la app. `hasta` se manda como el inicio del dia
// SIGUIENTE (el back usa `< hasta`, no `<= hasta`) para incluir el dia
// completo de `dateTo`.
function toOffsetIso(date) {
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const offset = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${offset}`;
}

function rangoParams(dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return {};
  const params = {};
  if (dateFrom) params.desde = toOffsetIso(new Date(`${dateFrom}T00:00:00`));
  if (dateTo) {
    const fin = new Date(`${dateTo}T00:00:00`);
    fin.setDate(fin.getDate() + 1);
    params.hasta = toOffsetIso(fin);
  }
  return params;
}

// Dueño con sucursal elegida manda sucursalId; sin sucursal (Dueño "todas")
// manda todas=true. Encargado/Empleado no necesitan nada de esto (el back
// siempre usa la sucursal de su token), pero no estorba mandarlo igual.
function alcanceParams(branchId) {
  return branchId ? { sucursalId: branchId } : { todas: "true" };
}

function buildQuery(params) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") usp.set(key, value);
  });
  const query = usp.toString();
  return query ? `?${query}` : "";
}

// Fila de desglose (ventas agrupadas) -> shape que ya esperan
// SalesComparisonList/SalesDetailTable ({id, name, total, operaciones,
// unidades, ticketPromedio}).
function mapDesgloseRow(raw) {
  return {
    id: raw.etiqueta,
    name: raw.etiqueta,
    operaciones: raw.operaciones ?? null,
    unidades: raw.cantidad ?? null,
    ticketPromedio: raw.ticket_promedio != null ? Number(raw.ticket_promedio) : null,
    total: Number(raw.total ?? 0),
  };
}


export async function getResumenReporte({ branchId, dateFrom, dateTo, periodo } = {}) {
  const rango = dateFrom || dateTo ? rangoParams(dateFrom, dateTo) : { periodo };
  const query = buildQuery({ ...alcanceParams(branchId), ...rango });
  const data = await httpClient.get(`/api/opticas/reportes/resumen${query}`);
  return {
    periodo: data.periodo,
    ventas: {
      total: Number(data.ventas?.total ?? 0),
      operaciones: data.ventas?.operaciones ?? 0,
      ticketPromedio: Number(data.ventas?.ticket_promedio ?? 0),
    },
    citas: data.citas,
    clientes: data.clientes,
    inventario: data.inventario,
  };
}


export async function getVentasReporte({ branchId, dateFrom, dateTo, agrupar, limit } = {}) {
  const query = buildQuery({ ...alcanceParams(branchId), ...rangoParams(dateFrom, dateTo), agrupar, limit });
  const data = await httpClient.get(`/api/opticas/reportes/ventas${query}`);
  return {
    total: Number(data.total ?? 0),
    operaciones: data.operaciones ?? 0,
    ticketPromedio: Number(data.ticket_promedio ?? 0),
    desglose: Array.isArray(data.desglose) ? data.desglose.map(mapDesgloseRow) : [],
  };
}


export async function getServiciosReporte({ branchId, dateFrom, dateTo, servicioId, limit } = {}) {
  const query = buildQuery({ ...alcanceParams(branchId), ...rangoParams(dateFrom, dateTo), servicioId, limit });
  const data = await httpClient.get(`/api/opticas/reportes/servicios${query}`);
  return {
    solicitados: data.solicitados ?? 0,
    realizados: data.realizados ?? 0,
    ingreso: Number(data.ingreso ?? 0),
    ranking: (data.ranking ?? []).map((row) => ({
      id: row.servicio_id,
      name: row.etiqueta,
      total: row.cantidad ?? 0,
      realizados: row.realizados ?? 0,
      ingreso: Number(row.ingreso ?? 0),
    })),
  };
}


export async function getClientesReporte({ branchId, dateFrom, dateTo } = {}) {
  const query = buildQuery({ ...alcanceParams(branchId), ...rangoParams(dateFrom, dateTo) });
  const data = await httpClient.get(`/api/opticas/reportes/clientes${query}`);
  return {
    total: data.total ?? 0,
    nuevos: data.nuevos ?? 0,
    recurrentes: data.recurrentes ?? 0,
    atendidos: data.atendidos ?? 0,
  };
}


export async function getCitasReporte({ branchId, dateFrom, dateTo, estado, agrupar } = {}) {
  const query = buildQuery({ ...alcanceParams(branchId), ...rangoParams(dateFrom, dateTo), estado, agrupar });
  const data = await httpClient.get(`/api/opticas/reportes/citas${query}`);
  return {
    total: data.total ?? 0,
    programadas: data.programadas ?? 0,
    confirmadas: data.confirmadas ?? 0,
    atendidas: data.atendidas ?? 0,
    canceladas: data.canceladas ?? 0,
    noAsistio: data.no_asistio ?? 0,
    desglose: Array.isArray(data.desglose) ? data.desglose.map(mapDesgloseRow) : null,
  };
}
