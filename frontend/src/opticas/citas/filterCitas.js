export function filterCitas(citas = [], { query = "", status = "", date = "" } = {}) {
  const term = query.trim().toLowerCase();

  return citas.filter((cita) => {
    const matchesQuery = !term || (cita.patientName ?? "").toLowerCase().includes(term);
    const matchesStatus = !status || cita.status === status;
    const matchesDate = !date || (cita.dateTime ?? "").slice(0, 10) === date;
    return matchesQuery && matchesStatus && matchesDate;
  });
}
