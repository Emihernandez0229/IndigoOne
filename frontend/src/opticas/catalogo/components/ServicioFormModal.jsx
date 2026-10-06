import { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { SERVICE_CATEGORIES, DEFAULT_TAX_RATE } from "../constants";


const EMPTY = {
  code: "", name: "", category: "", description: "", price: "", tax: String(DEFAULT_TAX_RATE), duration: "",
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
    tax: servicio.tax ?? DEFAULT_TAX_RATE,
    duration: servicio.duration ?? "",
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

  const set = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    const code = String(form.code ?? "").trim();
    const name = String(form.name ?? "").trim();

    if (!code) nextErrors.code = "El código es obligatorio.";
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
        tax: Number(form.tax) || 0,
        duration: form.duration ? Number(form.duration) : 0,
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
          <Input label="Código" value={form.code} onChange={set("code")} error={errors.code} />
          <Input label="Nombre" value={form.name} onChange={set("name")} error={errors.name} />
        </div>

        <div className="w-full">
          <label htmlFor="serv-desc" className="mb-2 block text-sm font-medium text-text-primary">Descripción</label>
          <textarea id="serv-desc" value={form.description} onChange={set("description")} rows={2} className={`${selectClass} resize-none`} />
        </div>

        <div className="w-full">
          <label htmlFor="serv-category" className="mb-2 block text-sm font-medium text-text-primary">Categoría</label>
          <select id="serv-category" value={form.category} onChange={set("category")} className={selectClass}>
            <option value="">Selecciona...</option>
            {SERVICE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {errors.category && <p className="mt-1.5 text-sm text-error">{errors.category}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Precio" type="number" min="0" step="0.01" value={form.price} onChange={set("price")} error={errors.price} />
          <Input label="Impuesto (%)" type="number" min="0" step="0.01" value={form.tax} onChange={set("tax")} />
          <Input label="Duración estimada (min)" type="number" min="0" value={form.duration} onChange={set("duration")} />
        </div>

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
