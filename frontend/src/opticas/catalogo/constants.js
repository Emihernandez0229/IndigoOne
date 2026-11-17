// Las categorías de productos/servicios ya no son una lista fija: el back
// las administra (categorias_productos / categorias_servicios) y se piden
// con useCategoriasProductos()/useCategoriasServicios() (ver hooks/useCategorias.js).

export const MEASUREMENT_UNITS = [
  { value: "pieza", label: "Pieza" },
  { value: "par", label: "Par" },
  { value: "caja", label: "Caja" },
];

export const CATALOG_STATUSES = [
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
];

export const DEFAULT_TAX_RATE = 16;
