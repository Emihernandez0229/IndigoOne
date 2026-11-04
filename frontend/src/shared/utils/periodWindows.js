const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function formatAxisDate(date) {
  if (!date) return "";
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}


// Ventanas de fecha reutilizadas por los dashboards de rol (Indigo y
// Ópticas) y por Reportes (Gerente/Subgerente de Indigo) para sus graficas
// de "Semanal/Mensual/Anual". Cada quien sigue calculando SU propio valor
// por ventana (suma de monto, conteo de terminados, estadisticas
// completas...), eso no cambia aqui.
//   "week"         -> ultimos 7 dias, uno por dia (el ultimo = "Hoy").
//   "month"        -> ultimas 4 semanas.
//   "year"         -> los 12 meses del año en curso (enero a diciembre).
//   "year-rolling" -> los ultimos 12 meses terminando en el mes actual.
//   "range"        -> buckets semanales entre range.from y range.to.
export function buildPeriodWindows(mode, range) {
  const now = new Date();

  if (mode === "week") {
    const windows = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now); day.setDate(now.getDate() - i);
      const from = new Date(day); from.setHours(0, 0, 0, 0);
      const to = new Date(day); to.setHours(23, 59, 59, 999);
      windows.push({ label: i === 0 ? "Hoy" : WEEKDAY_LABELS[day.getDay()], from, to });
    }
    return windows;
  }

  if (mode === "month") {
    const windows = [];
    for (let i = 3; i >= 0; i--) {
      const to = new Date(now); to.setDate(now.getDate() - i * 7);
      const from = new Date(to); from.setDate(to.getDate() - 6); from.setHours(0, 0, 0, 0);
      windows.push({ label: i === 0 ? "Esta semana" : `Hace ${i} sem.`, from, to });
    }
    return windows;
  }

  if (mode === "year") {
    const windows = [];
    for (let m = 0; m < 12; m++) {
      const from = new Date(now.getFullYear(), m, 1);
      const to = new Date(now.getFullYear(), m + 1, 0, 23, 59, 59, 999);
      windows.push({ label: MONTH_LABELS[m], from, to });
    }
    return windows;
  }

  if (mode === "year-rolling") {
    const windows = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const from = new Date(d.getFullYear(), d.getMonth(), 1);
      const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      windows.push({ label: MONTH_LABELS[d.getMonth()], from, to });
    }
    return windows;
  }

  // "range": buckets semanales entre range.from y range.to.
  if (!range?.from || !range?.to) return [];
  const windows = [];
  const cursor = new Date(range.from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(range.to);

  while (cursor <= end) {
    const bucketEnd = new Date(cursor);
    bucketEnd.setDate(bucketEnd.getDate() + 6);
    bucketEnd.setHours(23, 59, 59, 999);
    const effectiveEnd = bucketEnd > end ? end : bucketEnd;
    windows.push({ label: formatAxisDate(cursor), from: new Date(cursor), to: effectiveEnd });
    cursor.setDate(cursor.getDate() + 7);
  }

  return windows;
}
