import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import ImageUploadField from "../../../shared/components/ImageUploadField";
import { isValidHexColor } from "../../../shared/utils/validators";
import { BRAND_COLORS } from "../constants";

const colorName = (hex) =>
  BRAND_COLORS.find((c) => c.principal.toLowerCase() === hex?.toLowerCase() || c.secundario.toLowerCase() === hex?.toLowerCase())?.name;


export default function IdentidadVisualTab({ info, canManage, onSave, onCancel }) {

  const [form, setForm] = useState(info);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(info), [info]);

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-surface p-6">
        <p className="mb-4 text-sm text-text-secondary">Imagen de la óptica en documentos y comunicaciones.</p>
        <div className="mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-background">
          {info.logoUrl ? (
            <img src={info.logoUrl} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-text-secondary">Sin logo</span>
          )}
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <ColorPreviewField label="Color principal" value={info.colorPrincipal} />
          <ColorPreviewField label="Color secundario" value={info.colorSecundario} />
          <Field label="Eslogan" value={info.eslogan} />
        </dl>
      </div>
    );
  }

  const set = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const setColor = (field) => (hex) => {
    setForm((prev) => ({ ...prev, [field]: hex }));
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
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-surface p-6">

      <p className="mb-4 text-sm text-text-secondary">Personaliza la imagen de tu óptica en documentos y comunicaciones.</p>

      <div className="mb-5">
        <ImageUploadField
          label="Logo"
          value={form.logoUrl}
          onChange={(dataUrl) => setForm((prev) => ({ ...prev, logoUrl: dataUrl }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ColorSwatchPicker
          label="Color principal"
          value={form.colorPrincipal}
          error={errors.colorPrincipal}
          colorKey="principal"
          onChange={setColor("colorPrincipal")}
        />
        <ColorSwatchPicker
          label="Color secundario"
          value={form.colorSecundario}
          error={errors.colorSecundario}
          colorKey="secundario"
          onChange={setColor("colorSecundario")}
        />
      </div>

      <div className="mt-4">
        <Input label="Eslogan" value={form.eslogan ?? ""} onChange={set("eslogan")} placeholder="Frase representativa de tu óptica" />
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
        <Button type="button" variant="outline" onClick={() => { setForm(info); onCancel?.(); }}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
      </div>

    </form>
  );

}


function ColorSwatchPicker({ label, value, error, colorKey, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-text-primary">{label}</label>
      <div className="flex flex-wrap gap-2">
        {BRAND_COLORS.map((color) => {
          const hex = color[colorKey];
          const selected = hex.toLowerCase() === (value ?? "").toLowerCase();
          return (
            <button
              key={color.name}
              type="button"
              title={color.name}
              aria-label={color.name}
              onClick={() => onChange(hex)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 transition ${
                selected ? "border-indigo-primary ring-2 ring-indigo-light" : "border-gray-200"
              }`}
              style={{ backgroundColor: hex }}
            >
              {selected && <Check className="h-4 w-4 text-white drop-shadow" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-sm text-text-secondary">{colorName(value) || "Selecciona un color"}</p>
      {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
    </div>
  );
}


function ColorPreviewField({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="mt-1 flex items-center gap-2 text-sm text-text-primary">
        <span className="h-4 w-4 rounded-full border border-gray-200" style={{ backgroundColor: value || "#ffffff" }} />
        {colorName(value) || value || "—"}
      </dd>
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
