import { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { onlyLetters, onlyDigits, alphanumericDash } from "../../../shared/utils/textInput";
import { SERVICE_CATEGORIES } from "../constants";


const CODE_MAX = 10;
const NAME_MAX = 40;
const DESCRIPTION_MAX = 100;

const EMPTY = {
  code: "", name: "", category: "", description: "", price: "",
};

function crearForm(servicio) {
  if (!servicio) return { ...EMPTY };
  return {
    ...EMPTY,
    code: servicio.code ?? "",
    name: servicio.name ?? "",
    category: servicio.category ?? "",
    description: servicio.description ?? "",
    price: servicio.price ?? "",
  };
}


export default function ServicioFormModal({ open, mode = "create", servicio = null, onClose, onSubmit }) {

  const [form, setForm] = useState(() => crearForm(servicio));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const titles = { create: "Nuevo servicio", edit: "Editar servicio" };

  useEffect(() => {
    if (!open) return;
    setForm(crearForm(servicio));
    setErrors({});
  }, [open, servicio]);

  const set = (field, transform) => (event) => {
    const raw = event.target.value;
    const value = transform ? transform(raw) : raw;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    const code = String(form.code ?? "").trim();
    const name = String(form.name ?? "").trim();

    if (!code) nextErrors.code = "El SKU es obligatorio.";
    if (!name) nextErrors.name = "El nombre es obligatorio.";
    if (!form.category) nextErrors.category = "Selecciona una categoría.";
    if (form.price === "" || Number(form.price) < 0) nextErrors.price = "Indica el precio.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);
      await onSubmit({
        code,
        name,
        category: form.category,
        description: String(form.description ?? "").trim(),
        price: Number(form.price),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };


  return (
    <Modal isOpen={open} onClose={onClose} title={titles[mode]} size="lg">

      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="SKU" value={form.code} onChange={set("code", (v) => alphanumericDash(v, CODE_MAX))} error={errors.code} />
          <Input label="Nombre" value={form.name} onChange={set("name", (v) => onlyLetters(v, NAME_MAX))} error={errors.name} />
        </div>

        <div className="w-full">
          <label htmlFor="serv-desc" className="mb-2 block text-sm font-medium text-text-primary">Descripción</label>
          <textarea
            id="serv-desc"
            value={form.description}
            onChange={set("description", (v) => v.slice(0, DESCRIPTION_MAX))}
            rows={2}
            maxLength={DESCRIPTION_MAX}
            className={`${selectClass} resize-none`}
          />
          <p className="mt-1 text-right text-xs text-text-secondary">{form.description.length}/{DESCRIPTION_MAX}</p>
        </div>

        <div className="w-full">
          <label htmlFor="serv-category" className="mb-2 block text-sm font-medium text-text-primary">Categoría</label>
          <select id="serv-category" value={form.category} onChange={set("category")} className={selectClass}>
            <option value="">Selecciona...</option>
            {SERVICE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {errors.category && <p className="mt-1.5 text-sm text-error">{errors.category}</p>}
        </div>

        <Input label="Precio" value={form.price} onChange={set("price", (v) => onlyDigits(v))} error={errors.price} />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </div>

      </form>
    </Modal>
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
  disabled:cursor-not-allowed
  disabled:opacity-50
`;
