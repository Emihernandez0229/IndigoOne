import { useEffect, useState } from "react";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import ImageUploadField from "../../../shared/components/ImageUploadField";
import { isValidHexColor } from "../../../shared/utils/validators";


export default function IdentidadMarcaTab({ info, canManage, onSave }) {

  const [form, setForm] = useState(info);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(info), [info]);

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-surface p-6">
        <p className="mb-4 text-sm text-text-secondary">Personaliza la imagen de tu óptica en documentos y comunicaciones.</p>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Color principal" value={info.colorPrincipal} />
          <Field label="Color secundario" value={info.colorSecundario} />
          <Field label="Eslogan" value={info.eslogan} />
          <Field label="Pie de documentos" value={info.pieDocumentos} />
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
    if (!isValidHexColor(form.colorPrincipal)) nextErrors.colorPrincipal = "Usa un color hexadecimal válido (#RRGGBB).";
    if (!isValidHexColor(form.colorSecundario)) nextErrors.colorSecundario = "Usa un color hexadecimal válido (#RRGGBB).";

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
    <form onSubmit={handleSubmit} className="grid gap-6 rounded-2xl border border-gray-200 bg-surface p-6 lg:grid-cols-2">

      <div>
        <p className="mb-4 text-sm text-text-secondary">Personaliza la imagen de tu óptica en documentos y comunicaciones.</p>

        <div className="mb-5">
          <ImageUploadField
            label="Logo"
            value={form.logoUrl}
            onChange={(dataUrl) => setForm((prev) => ({ ...prev, logoUrl: dataUrl }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField label="Color principal" value={form.colorPrincipal} error={errors.colorPrincipal} onChange={set("colorPrincipal")} />
          <ColorField label="Color secundario" value={form.colorSecundario} error={errors.colorSecundario} onChange={set("colorSecundario")} />
        </div>

        <div className="mt-4">
          <Input label="Eslogan" value={form.eslogan ?? ""} onChange={set("eslogan")} placeholder="Frase representativa de tu óptica" />
        </div>

        <div className="mt-4 w-full">
          <label htmlFor="marca-pie" className="mb-2 block text-sm font-medium text-text-primary">Pie de documentos</label>
          <textarea
            id="marca-pie"
            value={form.pieDocumentos ?? ""}
            onChange={set("pieDocumentos")}
            rows={2}
            className="w-full resize-none rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button type="button" variant="outline" onClick={() => setForm(info)}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-text-primary">Vista previa en documentos</p>
        <div className="overflow-hidden rounded-xl border border-gray-200 p-5" style={{ borderTopWidth: 4, borderTopColor: form.colorPrincipal || "#1E3AAB" }}>
          <div className="flex items-center gap-3">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo" className="h-10 w-10 object-contain" />
            ) : (
              <div className="h-10 w-10 rounded bg-background" />
            )}
            <div>
              <p className="font-bold" style={{ color: form.colorPrincipal || "#1E3AAB" }}>{info.nombreComercial || "Tu óptica"}</p>
              {form.eslogan && <p className="text-xs text-text-secondary">{form.eslogan}</p>}
            </div>
          </div>

          <div className="mt-4 space-y-1 border-t border-gray-100 pt-4 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Lente Oftálmico</span>
              <span>$1,200.00</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Armazón</span>
              <span>$650.00</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-1 font-bold" style={{ color: form.colorSecundario || "#60DAFA" }}>
              <span>Total</span>
              <span>$1,850.00</span>
            </div>
          </div>

          {form.pieDocumentos && (
            <p className="mt-4 border-t border-gray-100 pt-3 text-center text-xs text-text-secondary">{form.pieDocumentos}</p>
          )}
        </div>
      </div>

    </form>
  );

}


function ColorField({ label, value, error, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-text-primary">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#([0-9A-F]{3}){1,2}$/i.test(value ?? "") ? value : "#000000"}
          onChange={onChange}
          className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border border-gray-200"
        />
        <input
          type="text"
          value={value ?? ""}
          onChange={onChange}
          className="w-full rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light"
        />
      </div>
      {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
    </div>
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
