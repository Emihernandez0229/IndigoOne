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
    };
  });
}
