import { useEffect, useState } from "react";
import { Landmark, IdCard, FileText, Mail, MapPin, Hash, Globe } from "lucide-react";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { isValidEmail, isValidPostalCode, isValidRFC } from "../../../shared/utils/validators";
import { onlyLetters, onlyDigits, rfcInput } from "../../../shared/utils/textInput";
import { MEXICAN_STATES, COUNTRIES, TAX_REGIMES } from "../constants";
import { OpticaCardHeader, OpticaFieldChip, OpticaCardDecoration } from "./OpticaCardParts";


const RFC_MAX = 13;
const ADDRESS_MAX = 50;
const COLONIA_MAX = 20;
const NUMERO_MAX = 5;

const regimeLabel = (value) => TAX_REGIMES.find((r) => r.value === value)?.label ?? value;


export default function InformacionFiscalTab({ info, canManage, onSave, onCancel }) {

  const [form, setForm] = useState(info);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(info), [info]);

  if (!canManage) {
    return (
      <div className="space-y-6">

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-surface p-6">
          <OpticaCardDecoration />
          <OpticaCardHeader icon={Landmark} title="Información fiscal" description="Datos fiscales de la empresa, para facturación." tone="purple" />
          <div className="relative grid gap-5 sm:grid-cols-2 sm:gap-x-8">
            <div className="space-y-5 sm:border-r sm:border-gray-100 sm:pr-8">
              <OpticaFieldChip icon={IdCard} label="RFC" value={info.rfc} tone="blue" />
              <OpticaFieldChip icon={Mail} label="Correo fiscal" value={info.correoFiscal} tone="rose" />
            </div>
            <div className="space-y-5">
              <OpticaFieldChip icon={FileText} label="Régimen fiscal" value={regimeLabel(info.regimenFiscal)} tone="amber" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-surface p-6">
          <OpticaCardHeader icon={MapPin} title="Domicilio fiscal" description="Dirección registrada para la facturación." tone="teal" />
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-x-8">
            <div className="space-y-5 sm:border-r sm:border-gray-100 sm:pr-8">
              <OpticaFieldChip icon={MapPin} label="Calle" value={info.calle} tone="teal" />
              <OpticaFieldChip icon={Hash} label="Número interior" value={info.numeroInterior} optional tone="orange" />
              <OpticaFieldChip icon={Hash} label="Código postal" value={info.codigoPostal} tone="orange" />
              <OpticaFieldChip icon={MapPin} label="Estado" value={info.estadoDireccion} tone="emerald" />
            </div>
            <div className="space-y-5">
              <OpticaFieldChip icon={Hash} label="Número exterior" value={info.numeroExterior} tone="orange" />
              <OpticaFieldChip icon={MapPin} label="Colonia" value={info.colonia} tone="teal" />
              <OpticaFieldChip icon={MapPin} label="Municipio / Alcaldía" value={info.municipio} tone="emerald" />
              <OpticaFieldChip icon={Globe} label="País" value={info.pais} tone="sky" />
            </div>
          </div>
        </div>

      </div>
    );
  }

  const set = (field, transform) => (event) => {
    const raw = event.target.value;
    const value = transform ? transform(raw) : raw;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!String(form.rfc ?? "").trim()) nextErrors.rfc = "El RFC es obligatorio.";
    else if (!isValidRFC(form.rfc)) nextErrors.rfc = "El RFC no tiene un formato válido.";
    if (!form.regimenFiscal) nextErrors.regimenFiscal = "Selecciona un régimen fiscal.";
    if (form.correoFiscal && !isValidEmail(form.correoFiscal)) nextErrors.correoFiscal = "El correo no es válido.";

    if (!String(form.calle ?? "").trim()) nextErrors.calle = "La calle es obligatoria.";
    if (!String(form.numeroExterior ?? "").trim()) nextErrors.numeroExterior = "El número exterior es obligatorio.";
    if (!String(form.colonia ?? "").trim()) nextErrors.colonia = "La colonia es obligatoria.";
    if (!String(form.codigoPostal ?? "").trim()) nextErrors.codigoPostal = "El código postal es obligatorio.";
    else if (!isValidPostalCode(form.codigoPostal)) nextErrors.codigoPostal = "El código postal debe tener 5 dígitos.";
    if (!String(form.municipio ?? "").trim()) nextErrors.municipio = "El municipio / alcaldía es obligatorio.";
    if (!form.estadoDireccion) nextErrors.estadoDireccion = "Selecciona un estado.";
    if (!form.pais) nextErrors.pais = "Selecciona un país.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-2xl border border-gray-200 bg-surface p-6">
      <OpticaCardDecoration />
      <OpticaCardHeader icon={Landmark} title="Información fiscal" description="Datos fiscales de la empresa, para facturación." />

      <div className="relative grid gap-4 sm:grid-cols-2">
        <Input label="RFC *" value={form.rfc ?? ""} onChange={set("rfc", (v) => rfcInput(v, RFC_MAX))} error={errors.rfc} />

        <div className="w-full">
          <label htmlFor="fiscal-regimen" className="mb-2 block text-sm font-medium text-text-primary">Régimen fiscal *</label>
          <select id="fiscal-regimen" value={form.regimenFiscal ?? ""} onChange={set("regimenFiscal")} className={selectClass}>
            <option value="">Selecciona...</option>
            {TAX_REGIMES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          {errors.regimenFiscal && <p className="mt-1.5 text-sm text-error">{errors.regimenFiscal}</p>}
        </div>

        <Input label="Correo fiscal" type="email" value={form.correoFiscal ?? ""} onChange={set("correoFiscal")} error={errors.correoFiscal} />
      </div>

      <p className="relative mb-4 mt-6 border-t border-gray-100 pt-4 text-sm font-medium text-text-primary">Domicilio fiscal</p>

      <div className="relative grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Input label="Calle *" value={form.calle ?? ""} onChange={set("calle", (v) => onlyLetters(v, ADDRESS_MAX))} error={errors.calle} />
        </div>
        <Input label="Número exterior *" value={form.numeroExterior ?? ""} onChange={set("numeroExterior", (v) => v.slice(0, NUMERO_MAX))} error={errors.numeroExterior} />
      </div>

      <div className="relative mt-4 grid gap-4 sm:grid-cols-3">
        <Input label="Número interior" value={form.numeroInterior ?? ""} onChange={set("numeroInterior", (v) => v.slice(0, NUMERO_MAX))} />
        <Input label="Colonia *" value={form.colonia ?? ""} onChange={set("colonia", (v) => onlyLetters(v, COLONIA_MAX))} error={errors.colonia} />
        <Input label="Código postal *" value={form.codigoPostal ?? ""} onChange={set("codigoPostal", (v) => onlyDigits(v, 5))} error={errors.codigoPostal} placeholder="5 dígitos" />
      </div>

      <div className="relative mt-4 grid gap-4 sm:grid-cols-3">
        <Input label="Municipio / Alcaldía *" value={form.municipio ?? ""} onChange={set("municipio")} error={errors.municipio} />

        <div className="w-full">
          <label htmlFor="fiscal-estado" className="mb-2 block text-sm font-medium text-text-primary">Estado *</label>
          <select id="fiscal-estado" value={form.estadoDireccion ?? ""} onChange={set("estadoDireccion")} className={selectClass}>
            <option value="">Selecciona...</option>
            {MEXICAN_STATES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {errors.estadoDireccion && <p className="mt-1.5 text-sm text-error">{errors.estadoDireccion}</p>}
        </div>

        <div className="w-full">
          <label htmlFor="fiscal-pais" className="mb-2 block text-sm font-medium text-text-primary">País *</label>
          <select id="fiscal-pais" value={form.pais ?? ""} onChange={set("pais")} className={selectClass}>
            <option value="">Selecciona...</option>
            {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {errors.pais && <p className="mt-1.5 text-sm text-error">{errors.pais}</p>}
        </div>
      </div>

      <div className="relative mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
        <Button type="button" variant="outline" onClick={() => { setForm(info); onCancel?.(); }}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
      </div>

    </form>
  );

}


const selectClass = `
  w-full
  rounded-xl
  border
  border-gray-200
  bg-surface
  px-4
  py-3
  text-text-primary
  outline-none
  transition
  focus:border-indigo-primary
  focus:ring-2
  focus:ring-indigo-light
`;
