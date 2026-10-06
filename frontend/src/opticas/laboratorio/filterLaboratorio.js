export function filterLaboratorio(orders = [], { query = "", status = "", date = "" } = {}) {
  const term = query.trim().toLowerCase();

  return orders.filter((order) => {
    const matchesQuery = !term || (order.patientName ?? "").toLowerCase().includes(term);
    const matchesStatus = !status || order.status === status;
    const matchesDate = !date || (order.createdAt ?? "").slice(0, 10) === date;
    return matchesQuery && matchesStatus && matchesDate;
  });
}
