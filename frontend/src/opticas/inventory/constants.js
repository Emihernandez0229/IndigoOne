export const PRODUCT_TYPES = [
  { value: "armazones", label: "Armazones" },
  { value: "micas", label: "Micas" },
  { value: "accesorios", label: "Accesorios" },
  { value: "estuches", label: "Estuches" },
  { value: "otros", label: "Otros" },
];

export const GENDERS = [
  { value: "hombre", label: "Hombre" },
  { value: "mujer", label: "Mujer" },
  { value: "unisex", label: "Unisex" },
];

// Las micas se fabrican bajo receta, no se despachan de un stock fijo - esta
// lista es solo informativa, para mostrar qué tratamientos ofrece Indigo.
export const LENS_TREATMENTS = [
  "Antirreflejante",
  "Filtro luz azul",
  "Fotocromático",
  "Policarbonato",
  "Alto índice",
];

// Tipos de movimiento de inventario, en un solo lugar. Dashboard (Owner/
// BranchManager) solo usa phrase/iconBg/iconColor para el feed de
// actividad; Reportes (InventarioReportTab) solo usa label/sign/badge para
// la tabla de movimientos - cada quien toma los campos que le sirven.
export const MOVIMIENTO_META = {
  entrada: { label: "Entrada", phrase: "entrada", sign: 1, badge: "entrada", iconBg: "bg-success/10", iconColor: "text-success" },
  salida: { label: "Salida", phrase: "salida", sign: -1, badge: "salida", iconBg: "bg-error/10", iconColor: "text-error" },
  ajustes: { label: "Ajuste", phrase: "un ajuste", sign: 1, badge: "ajustes", iconBg: "bg-indigo-light", iconColor: "text-indigo-primary" },
  ventas: { label: "Venta", phrase: "una venta", sign: -1, badge: "salida", iconBg: "bg-error/10", iconColor: "text-error" },
};
