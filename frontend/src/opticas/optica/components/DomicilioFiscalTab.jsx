import { useEffect, useState } from "react";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { isValidPostalCode } from "../../../shared/utils/validators";
import { MEXICAN_STATES, COUNTRIES } from "../constants";


export default function DomicilioFiscalTab({ info, canManage, onSave }) {

  const [form, setForm] = useState(info);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(info), [info]);

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-surface p-6">
        <p className="mb-4 text-sm text-text-secondary">Dirección legal y fiscal de la empresa.</p>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Calle" value={info.calle} />
          <Field label="Número exterior" value={info.numeroExterior} />
          <Field label="Número interior" value={info.numeroInterior} />
          <Field label="Colonia" value={info.colonia} />
          <Field label="Código postal" value={info.codigoPostal} />
          <Field label="Municipio / Alcaldía" value={info.municipio} />
          <Field label="Estado" value={info.estadoDireccion} />
          <Field label="País" value={info.pais} />
        </dl>
      </div>
    );
  }

  const set = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
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
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-surface p-6">

      <p className="mb-4 text-sm text-text-secondary">Dirección legal y fiscal de la empresa.</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Input label="Calle *" value={form.calle ?? ""} onChange={set("calle")} error={errors.calle} />
        </div>
        <Input label="Número exterior *" value={form.numeroExterior ?? ""} onChange={set("numeroExterior")} error={errors.numeroExterior} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Input label="Número interior" value={form.numeroInterior ?? ""} onChange={set("numeroInterior")} />
        <Input label="Colonia *" value={form.colonia ?? ""} onChange={set("colonia")} error={errors.colonia} />
        <Input label="Código postal *" value={form.codigoPostal ?? ""} onChange={set("codigoPostal")} error={errors.codigoPostal} placeholder="5 dígitos" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
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

      <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
        <Button type="button" variant="outline" onClick={() => setForm(info)}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
      </div>

    </form>
  );

}


function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="mt-1 text-sm text-text-primary">{value || "—"}</dd>
    </div>
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
