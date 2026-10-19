import { useEffect, useState } from "react";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { isValidEmail, isValidMexicanPhone } from "../../../shared/utils/validators";
import { onlyLetters, onlyDigits } from "../../../shared/utils/textInput";


const NAME_MAX = 50;


export default function InformacionGeneralTab({ info, canManage, onSave, onCancel }) {

  const [form, setForm] = useState(info);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(info), [info]);

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-surface p-6">
        <p className="mb-4 text-sm text-text-secondary">Datos básicos que identifican a tu empresa.</p>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre comercial" value={info.nombreComercial} />
          <Field label="Razón social" value={info.razonSocial} />
          <Field label="Teléfono general" value={info.telefono} />
          <Field label="Correo general" value={info.correo} />
          <Field label="Responsable sanitario" value={info.responsableSanitario} optional />
        </dl>
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
    if (!String(form.nombreComercial ?? "").trim()) nextErrors.nombreComercial = "El nombre comercial es obligatorio.";
    if (!String(form.razonSocial ?? "").trim()) nextErrors.razonSocial = "La razón social es obligatoria.";
    if (form.telefono && !isValidMexicanPhone(form.telefono)) nextErrors.telefono = "El teléfono debe tener 10 dígitos.";
    if (form.correo && !isValidEmail(form.correo)) nextErrors.correo = "El correo no es válido.";

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

      <p className="mb-4 text-sm text-text-secondary">Datos básicos que identifican a tu empresa.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nombre comercial *" value={form.nombreComercial ?? ""} onChange={set("nombreComercial", (v) => onlyLetters(v, NAME_MAX))} error={errors.nombreComercial} />
        <Input label="Razón social *" value={form.razonSocial ?? ""} onChange={set("razonSocial", (v) => onlyLetters(v, NAME_MAX))} error={errors.razonSocial} />
        <Input label="Teléfono general" value={form.telefono ?? ""} onChange={set("telefono", (v) => onlyDigits(v, 10))} error={errors.telefono} placeholder="10 dígitos" />
        <Input label="Correo general" type="email" value={form.correo ?? ""} onChange={set("correo")} error={errors.correo} />
        <Input label="Responsable sanitario (Opcional)" value={form.responsableSanitario ?? ""} onChange={set("responsableSanitario", (v) => onlyLetters(v, NAME_MAX))} />
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
        <Button type="button" variant="outline" onClick={() => { setForm(info); onCancel?.(); }}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
      </div>

    </form>
  );

}


function Field({ label, value, optional }) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
        {label}
        {optional && <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-medium normal-case text-text-secondary">Opcional</span>}
      </dt>
      <dd className="mt-1 text-sm text-text-primary">{value || "Sin registrar"}</dd>
    </div>
  );
}
