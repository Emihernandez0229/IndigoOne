// Agrupa el estado real del trabajo en las 4 categorias que muestra el
// modulo de Reportes (garantia cuenta como terminado: ya salio del flujo
// de laboratorio antes de pasar a revision de garantia).
export function categoryOf(job) {
  if (job.status === "loss") return "merma";
  if (job.status === "processing") return "processing";
  if (job.status === "pending") return "pending";
  return "completed";
}


export function getPeriodRange(mode, customFrom, customTo) {
  const now = new Date();

  if (mode === "day") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { from: start, to: now };
  }

  if (mode === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return { from: start, to: now };
  }

  if (mode === "month") {
    const start = new Date(now);
    start.setDate(now.getDate() - 30);
    return { from: start, to: now };
  }

  if (mode === "year") {
    const start = new Date(now);
    start.setFullYear(now.getFullYear() - 1);
    return { from: start, to: now };
  }

  if (mode === "range") {
    return {
      from: customFrom ? new Date(customFrom) : null,
      to: customTo ? new Date(`${customTo}T23:59:59`) : now,
    };
  }

  return { from: null, to: now };
}


export function previousRange(range) {
  if (!range.from || !range.to) return { from: null, to: null };
  const spanMs = range.to.getTime() - range.from.getTime();
  return { from: new Date(range.from.getTime() - spanMs), to: new Date(range.from.getTime()) };
}


export function inRange(dateValue, range) {
  const d = new Date(dateValue);
  if (range.from && d < range.from) return false;
  if (range.to && d > range.to) return false;
  return true;
}


export function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}


export function formatShortDate(date) {
  if (!date) return "";
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}


export function formatAxisDate(date) {
  if (!date) return "";
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}


function dayBuckets(jobs, from, to) {
  const buckets = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= to) {
    const dayStart = new Date(cursor);
    const dayEnd = new Date(cursor);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const inBucket = jobs.filter((j) => {
      const d = new Date(j.entryAt);
      return d >= dayStart && d < dayEnd;
    });

    buckets.push({
      name: formatAxisDate(dayStart),
      registrados: inBucket.length,
      terminados: inBucket.filter((j) => categoryOf(j) === "completed").length,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return buckets;
}


function weekBuckets(jobs, from, to, maxWeeks) {
  const buckets = [];
  let cursor = new Date(from);

  while (cursor < to) {
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const inBucket = jobs.filter((j) => {
      const d = new Date(j.entryAt);
      return d >= cursor && d < weekEnd;
    });

    buckets.push({
      name: formatAxisDate(cursor),
      registrados: inBucket.length,
      terminados: inBucket.filter((j) => categoryOf(j) === "completed").length,
    });

    cursor = weekEnd;
  }

  return buckets.slice(-maxWeeks);
}


// Granularidad de la grafica de tendencia segun el periodo elegido arriba
// (dia/semana/mes/rango): dia y semana se ven dia por dia, mes se ve
// semana por semana, y un rango personalizado se adapta a cuan largo sea.
export function computeTrendBuckets(jobs, periodMode, range) {
  const now = new Date();

  if (periodMode === "day") {
    const from = new Date(now);
    from.setDate(now.getDate() - 6);
    return dayBuckets(jobs, from, now);
  }

  if (periodMode === "week") {
    const from = new Date(now);
    from.setDate(now.getDate() - 13);
    return dayBuckets(jobs, from, now);
  }

  if (periodMode === "month") {
    const from = new Date(now);
    from.setDate(now.getDate() - 7 * 6);
    return weekBuckets(jobs, from, now, 6);
  }

  if (!range.from || !range.to) return [];

  const spanDays = (range.to - range.from) / 86400000;
  return spanDays <= 14
    ? dayBuckets(jobs, range.from, range.to)
    : weekBuckets(jobs, range.from, range.to, 12);
}


const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Ventanas de fecha reutilizadas por los dashboards de rol y por Reportes
// (Gerente/Subgerente) para sus graficas de "Semanal/Mensual/Anual" - antes
// esta misma logica estaba copiada en 3 archivos distintos. Cada quien
// sigue calculando SU propio valor por ventana (suma de monto, conteo de
// terminados, estadisticas completas...), eso no cambia aqui.
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


export function computeBranchStats(jobs, branches) {
  return branches.map((branch) => {
    const branchJobs = jobs.filter((j) => j.branchId === branch.id);
    const completed = branchJobs.filter((j) => categoryOf(j) === "completed").length;
    const processing = branchJobs.filter((j) => categoryOf(j) === "processing").length;
    const pending = branchJobs.filter((j) => categoryOf(j) === "pending").length;
    const merma = branchJobs.filter((j) => categoryOf(j) === "merma").length;
    const total = branchJobs.length;

    return {
      id: branch.id,
      name: branch.name,
      total,
      completed,
      processing,
      pending,
      merma,
      pctCompleted: pct(completed, total),
      pctMerma: pct(merma, total),
      jobs: branchJobs,
    };
  });
}
