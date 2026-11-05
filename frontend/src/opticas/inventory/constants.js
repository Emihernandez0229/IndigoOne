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
// Las claves coinciden con el "tipo" real que guarda el back
// (stock_movimientos.tipo: entrada/salida/ajuste/venta/devolucion); solo
// entrada/salida/ajuste se capturan a mano (ver StockMovementModal), los
// otros dos los genera el sistema solo.
export const MOVIMIENTO_META = {
  entrada: { label: "Entrada", phrase: "entrada", sign: 1, badge: "entrada", iconBg: "bg-success/10", iconColor: "text-success" },
  salida: { label: "Salida", phrase: "salida", sign: -1, badge: "salida", iconBg: "bg-error/10", iconColor: "text-error" },
  ajuste: { label: "Ajuste", phrase: "un ajuste", sign: 1, badge: "ajuste", iconBg: "bg-indigo-light", iconColor: "text-indigo-primary" },
  venta: { label: "Venta", phrase: "una venta", sign: -1, badge: "salida", iconBg: "bg-error/10", iconColor: "text-error" },
  devolucion: { label: "Devolución", phrase: "una devolución", sign: 1, badge: "entrada", iconBg: "bg-success/10", iconColor: "text-success" },
};
