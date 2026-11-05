import { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Select from "../../../shared/components/Select";
import Button from "../../../shared/components/Button";
import { onlyLetters, onlyDigits, alphanumericDash } from "../../../shared/utils/textInput";
import { useCategoriasServicios } from "../hooks/useCategorias";


const CODE_MAX = 10;
const NAME_MAX = 40;
const DESCRIPTION_MAX = 100;

const EMPTY = {
  code: "", name: "", categoryId: "", description: "", price: "",
};

function crearForm(servicio) {
  if (!servicio) return { ...EMPTY };
  return {
    ...EMPTY,
    code: servicio.code ?? "",
    name: servicio.name ?? "",
    categoryId: servicio.categoryId != null ? String(servicio.categoryId) : "",
    description: servicio.description ?? "",
    price: servicio.price ?? "",
  };
}


export default function ServicioFormModal({ open, mode = "create", servicio = null, onClose, onSubmit }) {

  const [form, setForm] = useState(() => crearForm(servicio));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const { categorias: categoryOptions } = useCategoriasServicios();

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
    if (!form.categoryId) nextErrors.categoryId = "Selecciona una categoría.";
    if (form.price === "" || Number(form.price) < 0) nextErrors.price = "Indica el precio.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);
      await onSubmit({
        code,
        name,
        categoryId: form.categoryId,
        description: String(form.description ?? "").trim(),
        price: Number(form.price),
      });
      onClose();
    } catch {
      setErrors((prev) => ({ ...prev, submit: "No se pudo guardar el servicio. Intenta de nuevo." }));
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
          <Select id="serv-category" value={form.categoryId} onChange={set("categoryId")}>
            <option value="">Selecciona...</option>
            {categoryOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
          {errors.categoryId && <p className="mt-1.5 text-sm text-error">{errors.categoryId}</p>}
        </div>

        <Input label="Precio" value={form.price} onChange={set("price", (v) => onlyDigits(v))} error={errors.price} />

        {errors.submit && <p className="text-sm text-error">{errors.submit}</p>}

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
