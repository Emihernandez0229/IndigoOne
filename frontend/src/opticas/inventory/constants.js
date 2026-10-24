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
