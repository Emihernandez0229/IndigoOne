// Mismos rangos que valida el back (ver ojoSchema en consultas.schema.js):
// esfera -30..30, cilindro -10..10, eje entero 0..180, adicion 0..5.
// Fuente unica para OjoGraduacionFields (mostrar el error) y
// NuevaConsultaPage (decidir si hay error).
export const OJO_RANGES = {
  esfera: [-30, 30],
  cilindro: [-10, 10],
  eje: [0, 180],
  adicion: [0, 5],
};

export const DIP_RANGE = [40, 85];
