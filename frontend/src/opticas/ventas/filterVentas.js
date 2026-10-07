export function filterVentas(ventas = [], { query = "", status = "", date = "" } = {}) {
  const term = query.trim().toLowerCase();

  return ventas.filter((venta) => {
    const matchesQuery =
      !term ||
      (venta.patientName ?? "").toLowerCase().includes(term) ||
      venta.items.some((item) =>
        (item.code ?? "").toLowerCase().includes(term) ||
        (item.model ?? "").toLowerCase().includes(term)
      );
    const matchesStatus = !status || venta.status === status;
    const matchesDate = !date || (venta.createdAt ?? "").slice(0, 10) === date;
    return matchesQuery && matchesStatus && matchesDate;
  });
}
