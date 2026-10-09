function periodRange(period) {
  const now = new Date();
  const start = new Date(now);

  if (period === "week") {
    start.setDate(now.getDate() - 7);
  } else if (period === "month") {
    start.setMonth(now.getMonth() - 1);
  } else if (period === "year") {
    start.setFullYear(now.getFullYear() - 1);
  } else {
    return null;
  }

  return { from: start, to: now };
}


export function filterLaboratoryJobs(
  jobs = [],
  { query = "", branch = "", status = "", serviceType = "", priority = "", period = "", customFrom = "", customTo = "" } = {}
) {

  const q = query.trim().toLowerCase();

  const range =
    period === "custom"
      ? {
          from: customFrom ? new Date(customFrom) : null,
          to: customTo ? new Date(`${customTo}T23:59:59`) : null,
        }
      : period
      ? periodRange(period)
      : null;

  return jobs.filter((job) => {
    const matchesQuery =
      !q ||
      (job.folio ?? "").toLowerCase().includes(q) ||
      (job.clientName ?? "").toLowerCase().includes(q) ||
      (job.branchName ?? "").toLowerCase().includes(q) ||
      (job.seller ?? "").toLowerCase().includes(q);

    const matchesBranch = !branch || String(job.branchId) === String(branch);
    const matchesStatus = !status || job.status === status;
    const matchesServiceType = !serviceType || job.serviceType === serviceType;
    const matchesPriority = !priority || (priority === "urgent" ? job.urgent : !job.urgent);

    const entryDate = new Date(job.entryAt);
    const matchesPeriod =
      !range ||
      ((!range.from || entryDate >= range.from) && (!range.to || entryDate <= range.to));

    return matchesQuery && matchesBranch && matchesStatus && matchesServiceType && matchesPriority && matchesPeriod;
  });

}
