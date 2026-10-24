import { useState } from "react";
import { Palette, Pencil, Check, Copy, Upload, ImageOff, Quote } from "lucide-react";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import ImageUploadField from "../../../shared/components/ImageUploadField";
import { BRAND_COLORS } from "../constants";
import { OpticaCardHeader, OpticaCardDecoration } from "./OpticaCardParts";


export default function IdentidadVisualTab({ info, canManage, onSave }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-surface p-6">
      <OpticaCardDecoration />
      <OpticaCardHeader icon={Palette} title="Identidad visual" description="Personaliza la imagen de tu óptica en documentos y comunicaciones." tone="rose" />

      <div className="relative grid gap-4 sm:grid-cols-3">
        <LogoCard info={info} canManage={canManage} onSave={onSave} />
        <ColorCard
          label="Color principal"
          description="Se usa en botones, encabezados y elementos clave."
          field="colorPrincipal"
          colorKey="principal"
          info={info}
          canManage={canManage}
          onSave={onSave}
        />
        <ColorCard
          label="Color secundario"
          description="Se usa en acentos, iconos y elementos de apoyo."
          field="colorSecundario"
          colorKey="secundario"
          info={info}
          canManage={canManage}
          onSave={onSave}
        />
      </div>

      <EsloganCard info={info} canManage={canManage} onSave={onSave} />
    </div>
  );
}


function LogoCard({ info, canManage, onSave }) {

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(info.logoUrl);
  const [saving, setSaving] = useState(false);

  const startEdit = () => { setValue(info.logoUrl); setEditing(true); };
  const cancel = () => { setValue(info.logoUrl); setEditing(false); };

  const save = async () => {
    try {
      setSaving(true);
      await onSave({ ...info, logoUrl: value });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-background p-5">
      <p className="mb-1 flex items-center gap-2 text-sm font-bold text-text-primary">
        Logo de la óptica
      </p>

      {editing ? (
        <div className="space-y-4">
          <ImageUploadField label="Logo" value={value} onChange={setValue} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="py-2 text-sm" onClick={cancel} disabled={saving}>Cancelar</Button>
            <Button type="button" className="py-2 text-sm" onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-1 text-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-surface">
            {info.logoUrl ? (
              <img src={info.logoUrl} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <ImageOff className="h-6 w-6 text-text-secondary" />
            )}
          </div>
          <p className="text-xs text-text-secondary">{info.logoUrl ? "Logo cargado" : "Sin logo"}</p>
          {canManage && (
            <Button type="button" variant="outline" className="inline-flex items-center gap-1.5 py-2 text-sm" onClick={startEdit}>
              <Upload className="h-4 w-4" />
              {info.logoUrl ? "Cambiar logo" : "Agregar logo"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}


function ColorCard({ label, description, field, colorKey, info, canManage, onSave }) {

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(info[field]);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const startEdit = () => { setValue(info[field]); setEditing(true); };
  const cancel = () => { setValue(info[field]); setEditing(false); };

  const save = async () => {
    try {
      setSaving(true);
      await onSave({ ...info, [field]: value });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(info[field] || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-background p-5">
      <p className="mb-1 text-sm font-bold text-text-primary">{label}</p>
      <p className="mb-4 text-xs text-text-secondary">{description}</p>

      {editing ? (
        <div className="space-y-4">
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
                  onClick={() => setValue(hex)}
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="py-2 text-sm" onClick={cancel} disabled={saving}>Cancelar</Button>
            <Button type="button" className="py-2 text-sm" onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="h-20 w-full rounded-xl border border-gray-200" style={{ backgroundColor: info[field] || "#ffffff" }} />
          <p className="mt-3 text-sm font-semibold text-text-primary">{info[field] || "—"}</p>
          {canManage && (
            <div className="mt-3 flex gap-4">
              <button type="button" onClick={startEdit} className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-primary">
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
              <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary">
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}


function EsloganCard({ info, canManage, onSave }) {

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(info.eslogan ?? "");
  const [saving, setSaving] = useState(false);

  const startEdit = () => { setValue(info.eslogan ?? ""); setEditing(true); };
  const cancel = () => { setValue(info.eslogan ?? ""); setEditing(false); };

  const save = async () => {
    try {
      setSaving(true);
      await onSave({ ...info, eslogan: value });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative mt-4 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-background p-5 sm:flex-row sm:items-center">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100">
        <Quote className="h-5 w-5 text-amber-600" />
      </span>

      <div className="sm:w-56 sm:shrink-0">
        <p className="text-sm font-bold text-text-primary">Eslogan</p>
      </div>

      {editing ? (
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Frase representativa de tu óptica" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="py-2.5 text-sm" onClick={cancel} disabled={saving}>Cancelar</Button>
            <Button type="button" className="py-2.5 text-sm" onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
          </div>
        </div>
      ) : (
        <>
          <p className="flex-1 text-center text-base font-semibold italic text-indigo-primary sm:text-left">
            {info.eslogan ? `"${info.eslogan}"` : "Sin eslogan"}
          </p>
          {canManage && (
            <Button type="button" variant="outline" className="inline-flex shrink-0 items-center gap-1.5 py-2 text-sm" onClick={startEdit}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          )}
        </>
      )}
    </div>
  );
}
