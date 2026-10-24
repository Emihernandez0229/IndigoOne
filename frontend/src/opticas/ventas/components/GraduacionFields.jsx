import { Eye } from "lucide-react";
import Input from "../../../shared/components/Input";
import { diopterValue } from "../../../shared/utils/textInput";


function EyeCard({ title, eje, values, onChange }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-light text-indigo-primary">
          <Eye className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input label="Esfera (SPH)" value={values.esfera} onChange={onChange(`${eje}Esfera`)} placeholder="Ej. -2.00" />
        <Input label="Cilindro (CYL)" value={values.cilindro} onChange={onChange(`${eje}Cilindro`)} placeholder="Ej. -0.75" />
        <Input label="Eje (AXIS)" value={values.eje} onChange={onChange(`${eje}Eje`)} placeholder="Ej. 180°" />
      </div>
    </div>
  );
}


/**
 * Captura de graduacion para una orden de laboratorio - mismos campos que
 * EMPTY_RECETA de laboratorio/constants.js, con los iconos de ojo que
 * pidio el usuario. Solo numeros (signo +/- y un punto decimal).
 */
export default function GraduacionFields({ receta, onChange }) {

  const set = (field) => (event) => onChange(field, diopterValue(event.target.value));

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Captura los valores de graduación para preparar la orden de laboratorio.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <EyeCard
          title="Ojo derecho (OD)"
          eje="od"
          values={{ esfera: receta.odEsfera, cilindro: receta.odCilindro, eje: receta.odEje }}
          onChange={set}
        />
        <EyeCard
          title="Ojo izquierdo (OI)"
          eje="oi"
          values={{ esfera: receta.oiEsfera, cilindro: receta.oiCilindro, eje: receta.oiEje }}
          onChange={set}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Adición (ADD)" value={receta.adicion} onChange={set("adicion")} placeholder="Ej. +1.50" />
        <Input label="Distancia pupilar (DP)" value={receta.dp} onChange={set("dp")} placeholder="Ej. 62 mm" />
      </div>

      <div className="space-y-1 rounded-xl bg-background p-3 text-xs text-text-secondary">
        <p><span className="font-medium text-text-primary">Esfera (SPH):</span> valores positivos, negativos y cero. Rango sugerido: −20.00 a +20.00 D.</p>
        <p><span className="font-medium text-text-primary">Cilindro (CYL):</span> valores positivos, negativos y cero. Rango sugerido: −6.00 a +6.00 D.</p>
        <p><span className="font-medium text-text-primary">Eje (AXIS):</span> solo números enteros del 1 al 180. Obligatorio si el cilindro es distinto de cero.</p>
        <p><span className="font-medium text-text-primary">Adición (ADD):</span> valores positivos en incrementos de 0.25 D. Rango sugerido: +0.75 a +4.00 D; puede quedar vacío.</p>
        <p><span className="font-medium text-text-primary">Distancia pupilar (DP):</span> número positivo en milímetros (ej. 40–80 mm binocular).</p>
      </div>
    </div>
  );
}
