function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-text-primary">{value || "—"}</dd>
    </div>
  );
}


/**
 * Lectura de la graduacion de una orden de laboratorio - mismo diseño
 * que la seccion "Graduación" de LaboratorioDetailPanel (sin iconos de
 * ojo, solo el nombre del ojo en negritas), para el detalle de una venta
 * de tipo "orden de laboratorio".
 */
export default function GraduacionSummary({ receta }) {

  if (!receta) return null;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-semibold text-text-primary">Ojo derecho (OD)</p>
          <dl className="grid grid-cols-3 gap-2">
            <Field label="Esfera" value={receta.odEsfera} />
            <Field label="Cilindro" value={receta.odCilindro} />
            <Field label="Eje" value={receta.odEje} />
          </dl>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-text-primary">Ojo izquierdo (OI)</p>
          <dl className="grid grid-cols-3 gap-2">
            <Field label="Esfera" value={receta.oiEsfera} />
            <Field label="Cilindro" value={receta.oiCilindro} />
            <Field label="Eje" value={receta.oiEje} />
          </dl>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
        <Field label="Adición" value={receta.adicion} />
        <Field label="Distancia pupilar (DP)" value={receta.dp} />
      </dl>
    </div>
  );
}
