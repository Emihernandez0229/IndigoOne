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


export function filterLaboratorio(
  orders = [],
  { query = "", status = "", period = "", customFrom = "", customTo = "" } = {}
) {

  const term = query.trim().toLowerCase();

  const range =
    period === "custom"
      ? {
          from: customFrom ? new Date(customFrom) : null,
          to: customTo ? new Date(`${customTo}T23:59:59`) : null,
        }
      : period
      ? periodRange(period)
      : null;

  return orders.filter((order) => {
    const matchesQuery = !term || (order.patientName ?? "").toLowerCase().includes(term);
    const matchesStatus = !status || order.status === status;

    const createdAt = new Date(order.createdAt);
    const matchesPeriod =
      !range ||
      ((!range.from || createdAt >= range.from) && (!range.to || createdAt <= range.to));

    return matchesQuery && matchesStatus && matchesPeriod;
  });
}
