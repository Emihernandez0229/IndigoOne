import { useEffect, useState } from "react";
import { Building2, FileText, Phone, Mail, User } from "lucide-react";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { isValidEmail, isValidMexicanPhone } from "../../../shared/utils/validators";
import { onlyLetters, onlyDigits } from "../../../shared/utils/textInput";
import { OpticaCardHeader, OpticaFieldChip, OpticaCardDecoration } from "./OpticaCardParts";


const NAME_MAX = 50;


export default function InformacionGeneralTab({ info, canManage, onSave, onCancel }) {

  const [form, setForm] = useState(info);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(info), [info]);

  if (!canManage) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-surface p-6">
        <OpticaCardDecoration />
        <OpticaCardHeader icon={Building2} title="Información de la empresa" description="Datos básicos que identifican a tu empresa." tone="blue" />
        <div className="relative grid gap-5 sm:grid-cols-2 sm:gap-x-8">
          <div className="space-y-5 sm:border-r sm:border-gray-100 sm:pr-8">
            <OpticaFieldChip icon={Building2} label="Nombre comercial" value={info.nombreComercial} tone="blue" />
            <OpticaFieldChip icon={Phone} label="Teléfono general" value={info.telefono} tone="teal" />
            <OpticaFieldChip icon={User} label="Responsable sanitario" value={info.responsableSanitario} optional tone="purple" />
          </div>
          <div className="space-y-5">
            <OpticaFieldChip icon={FileText} label="Razón social" value={info.razonSocial} tone="amber" />
            <OpticaFieldChip icon={Mail} label="Correo general" value={info.correo} tone="rose" />
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
    <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-2xl border border-gray-200 bg-surface p-6">
      <OpticaCardDecoration />
      <OpticaCardHeader icon={Building2} title="Información de la empresa" description="Datos básicos que identifican a tu empresa." />

      <div className="relative grid gap-4 sm:grid-cols-2">
        <Input label="Nombre comercial *" value={form.nombreComercial ?? ""} onChange={set("nombreComercial", (v) => onlyLetters(v, NAME_MAX))} error={errors.nombreComercial} />
        <Input label="Razón social *" value={form.razonSocial ?? ""} onChange={set("razonSocial", (v) => onlyLetters(v, NAME_MAX))} error={errors.razonSocial} />
        <Input label="Teléfono general" value={form.telefono ?? ""} onChange={set("telefono", (v) => onlyDigits(v, 10))} error={errors.telefono} placeholder="10 dígitos" />
        <Input label="Correo general" type="email" value={form.correo ?? ""} onChange={set("correo")} error={errors.correo} />
        <Input label="Responsable sanitario (Opcional)" value={form.responsableSanitario ?? ""} onChange={set("responsableSanitario", (v) => onlyLetters(v, NAME_MAX))} />
      </div>

      <div className="relative mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
        <Button type="button" variant="outline" onClick={() => { setForm(info); onCancel?.(); }}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
      </div>

    </form>
  );

}
