export function currency(value, { decimals = false } = {}) {
  const options = decimals ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : undefined;
  return `$${Number(value ?? 0).toLocaleString("es-MX", options)}`;
}


export function formatFecha(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");
}


export function formatHora(dateStr, { emptyValue = "—" } = {}) {
  if (!dateStr) return emptyValue;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return emptyValue;
  return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}
