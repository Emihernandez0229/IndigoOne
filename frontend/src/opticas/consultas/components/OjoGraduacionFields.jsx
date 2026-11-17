import Input from "../../../shared/components/Input";
import { diopterValue, onlyDigits } from "../../../shared/utils/textInput";


function fieldKey(prefix, field) {
  return `${prefix}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
}

function transform(field, raw) {
  if (field === "eje") return onlyDigits(raw, 3);
  return diopterValue(raw, 6);
}


function OjoRow({ prefix, code, label, badgeClass, values, errors, onChange }) {
  const set = (field) => (event) => onChange(field, transform(field, event.target.value));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-[auto_repeat(4,1fr)] sm:items-start sm:gap-4">
      <div className="col-span-2 flex items-center gap-2 sm:col-span-1 sm:flex-col sm:items-start sm:gap-1 sm:pt-8">
        <span className={`inline-flex h-7 items-center rounded-lg px-2.5 text-xs font-bold ${badgeClass}`}>{code}</span>
        <span className="text-xs text-text-secondary sm:hidden">{label}</span>
      </div>
      <Input label="Esfera" value={values.esfera} onChange={set("esfera")} placeholder="±0.00" error={errors[fieldKey(prefix, "esfera")]} />
      <Input label="Cilindro" value={values.cilindro} onChange={set("cilindro")} placeholder="-0.00" error={errors[fieldKey(prefix, "cilindro")]} />
      <Input label="Eje" value={values.eje} onChange={set("eje")} placeholder="000°" error={errors[fieldKey(prefix, "eje")]} />
      <Input label="Adición" value={values.adicion} onChange={set("adicion")} placeholder="+0.00" error={errors[fieldKey(prefix, "adicion")]} />
    </div>
  );
}


/**
 * Graduacion (Rx) para "Nueva consulta" - od/oi con esfera/cilindro/eje/
 * adicion cada uno (shape que pide crearConsultaBodySchema del back), mas
 * dip compartido. No incluye "agudeza visual": no existe en la tabla
 * `consultas` del back, asi que no hay donde guardarla.
 *
 * `errors` es el objeto plano de useFormValidation (claves "odEsfera",
 * "oiCilindro", "dip", etc.) - NuevaConsultaPage valida contra OJO_RANGES/
 * DIP_RANGE de ../constants.
 */
export default function OjoGraduacionFields({ od, oi, dip, errors = {}, onChangeOd, onChangeOi, onChangeDip }) {
  return (
    <div className="space-y-5">
      <OjoRow prefix="od" code="OD" label="Ojo derecho" badgeClass="bg-indigo-light text-indigo-primary" values={od} errors={errors} onChange={onChangeOd} />
      <OjoRow prefix="oi" code="OI" label="Ojo izquierdo" badgeClass="bg-success/10 text-success" values={oi} errors={errors} onChange={onChangeOi} />

      <div className="border-t border-gray-100 pt-4">
        <Input
          label="Distancia interpupilar - DIP (mm)"
          value={dip}
          onChange={(e) => onChangeDip(diopterValue(e.target.value, 5))}
          placeholder="Ej. 62"
          error={errors.dip}
        />
      </div>
    </div>
  );
}
