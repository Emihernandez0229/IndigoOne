import { useEffect, useState } from "react";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import ImageUploadField from "../../../shared/components/ImageUploadField";
import { isValidEmail, isValidMexicanPhone, isValidUrl, isValidRFC } from "../../../shared/utils/validators";


export default function InformacionGeneralTab({ info, canManage, onSave }) {

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
          <Field label="RFC" value={info.rfc} />
          <Field label="Responsable sanitario" value={info.responsableSanitario} />
          <Field label="Teléfono general" value={info.telefono} />
          <Field label="Correo general" value={info.correo} />
          <Field label="Sitio web" value={info.sitioWeb} />
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
    if (!String(form.nombreComercial ?? "").trim()) nextErrors.nombreComercial = "El nombre comercial es obligatorio.";
    if (!String(form.razonSocial ?? "").trim()) nextErrors.razonSocial = "La razón social es obligatoria.";
    if (!String(form.rfc ?? "").trim()) nextErrors.rfc = "El RFC es obligatorio.";
    else if (!isValidRFC(form.rfc)) nextErrors.rfc = "El RFC no tiene un formato válido.";
    if (form.telefono && !isValidMexicanPhone(form.telefono)) nextErrors.telefono = "El teléfono debe tener 10 dígitos.";
    if (form.correo && !isValidEmail(form.correo)) nextErrors.correo = "El correo no es válido.";
    if (form.sitioWeb && !isValidUrl(form.sitioWeb)) nextErrors.sitioWeb = "El sitio web no es válido.";

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

      <div className="mb-5">
        <ImageUploadField
          label="Logo de la óptica"
          value={form.logoUrl}
          onChange={(dataUrl) => setForm((prev) => ({ ...prev, logoUrl: dataUrl }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nombre comercial *" value={form.nombreComercial ?? ""} onChange={set("nombreComercial")} error={errors.nombreComercial} />
        <Input label="Razón social *" value={form.razonSocial ?? ""} onChange={set("razonSocial")} error={errors.razonSocial} />
        <Input label="RFC *" value={form.rfc ?? ""} onChange={set("rfc")} error={errors.rfc} />
        <Input label="Responsable sanitario" value={form.responsableSanitario ?? ""} onChange={set("responsableSanitario")} />
        <Input label="Teléfono general" value={form.telefono ?? ""} onChange={set("telefono")} error={errors.telefono} placeholder="10 dígitos" />
        <Input label="Correo general" type="email" value={form.correo ?? ""} onChange={set("correo")} error={errors.correo} />
        <Input label="Sitio web" value={form.sitioWeb ?? ""} onChange={set("sitioWeb")} error={errors.sitioWeb} placeholder="www.tuoptica.mx" />
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
