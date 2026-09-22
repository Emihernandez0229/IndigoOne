import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { useAuth } from "../../../shared/context/AuthContext";
import { ROLES } from "../../../shared/security/roles";
import { listBranches } from "../../branches/services/branchService";
import {
  PRODUCT_TYPES,
  GENDERS,
  MATERIALS_BY_TYPE,
  MAX_PRODUCT_PHOTOS,
  ACCEPTED_PHOTO_TYPES,
} from "../constants";


const EMPTY = {
  code: "",
  model: "",
  description: "",
  color: "",
  type: "",
  material: "",
  gender: "",
  measurements: "",
  stockAvailable: "",
  stockMin: "",
  cost: "",
  branchId: "",
  photos: [],
};


function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


function crearFormDesdeItem(item) {

  if (!item) {
    return { ...EMPTY };
  }

  return {
    ...EMPTY,
    code: item.code ?? "",
    model: item.model ?? "",
    description: item.description ?? "",
    color: item.color ?? "",
    type: item.type ?? "",
    material: item.material ?? "",
    gender: item.gender ?? "",
    measurements: item.measurements ?? "",
    stockAvailable: item.stockAvailable ?? "",
    stockMin: item.stockMin ?? "",
    cost: item.cost ?? "",
    branchId: item.branchId ?? "",
    photos: Array.isArray(item.photos) ? item.photos : [],
  };
}


export default function InventoryFormModal({
  open,
  mode = "create",
  item = null,
  onClose,
  onSubmit,
}) {

  const { user: currentUser } = useAuth();

  const [form, setForm] = useState(() => crearFormDesdeItem(item));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const fileInputRef = useRef(null);

  const isEdit = mode === "edit";

  const isBranchScoped =
    currentUser?.role === ROLES.INDIGO_GERENTE_SUCURSAL;

  const materialOptions = MATERIALS_BY_TYPE[form.type] ?? [];

  const titles = {
    create: "Nuevo producto",
    edit: "Editar producto",
  };


  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(crearFormDesdeItem(item));
    setErrors({});
  }, [open, item]);


  useEffect(() => {

    if (!open || isBranchScoped) {
      return;
    }

    let active = true;

    (async () => {
      try {
        setLoadingBranches(true);
        const data = await listBranches();
        if (active) {
          setBranches(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error al cargar sucursales:", error);
        if (active) {
          setBranches([]);
        }
      } finally {
        if (active) {
          setLoadingBranches(false);
        }
      }
    })();

    return () => {
      active = false;
    };

  }, [open, isBranchScoped]);


  const set = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };


  const handleTypeChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, type: value, material: "" }));
    setErrors((prev) => ({ ...prev, type: undefined, material: undefined }));
  };


  const handlePhotoSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    const remainingSlots = MAX_PRODUCT_PHOTOS - form.photos.length;
    if (remainingSlots <= 0 || files.length === 0) {
      return;
    }

    const validFiles = files.filter((file) => ACCEPTED_PHOTO_TYPES.includes(file.type));
    const accepted = validFiles.slice(0, remainingSlots);

    setErrors((prev) => ({
      ...prev,
      photos:
        validFiles.length < files.length
          ? "Solo se permiten imágenes PNG o JPG."
          : undefined,
    }));

    if (accepted.length === 0) {
      return;
    }

    const dataUrls = await Promise.all(accepted.map(readFileAsDataUrl));

    setForm((prev) => ({
      ...prev,
      photos: [...prev.photos, ...dataUrls],
    }));
  };


  const removePhoto = (index) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    const code = String(form.code ?? "").trim();
    const model = String(form.model ?? "").trim();
    const color = String(form.color ?? "").trim();
    const measurements = String(form.measurements ?? "").trim();

    if (!code) nextErrors.code = "El código es obligatorio.";
    if (!model) nextErrors.model = "El modelo es obligatorio.";
    if (!color) nextErrors.color = "El color es obligatorio.";
    if (!form.type) nextErrors.type = "Selecciona un tipo.";
    if (!form.material) nextErrors.material = "Selecciona un material.";
    if (!form.gender) nextErrors.gender = "Selecciona un género.";
    if (!measurements) nextErrors.measurements = "Indica las medidas.";

    if (form.stockAvailable === "" || Number(form.stockAvailable) < 0) {
      nextErrors.stockAvailable = "Indica el stock disponible.";
    }

    if (form.stockMin === "" || Number(form.stockMin) < 0) {
      nextErrors.stockMin = "Indica el stock mínimo.";
    }

    if (form.cost === "" || Number(form.cost) < 0) {
      nextErrors.cost = "Indica el costo.";
    }

    if (!isBranchScoped && !isEdit && !form.branchId) {
      nextErrors.branchId = "Selecciona una sucursal.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setSaving(true);
      await onSubmit({
        code,
        model,
        description: String(form.description ?? "").trim(),
        color,
        type: form.type,
        material: form.material,
        gender: form.gender,
        measurements,
        stockAvailable: Number(form.stockAvailable),
        stockMin: Number(form.stockMin),
        cost: Number(form.cost),
        branchId: form.branchId || null,
        photos: form.photos,
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

          <Input
            label="Código"
            value={form.code}
            onChange={set("code")}
            error={errors.code}
          />

          <Input
            label="Modelo"
            value={form.model}
            onChange={set("model")}
            error={errors.model}
          />

        </div>

        <div className="w-full">
          <label
            htmlFor="inventory-description"
            className="mb-2 block text-sm font-medium text-text-primary"
          >
            Descripción
          </label>
          <textarea
            id="inventory-description"
            value={form.description}
            onChange={set("description")}
            rows={2}
            className={`${selectClass} resize-none`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">

          <Input
            label="Color"
            value={form.color}
            onChange={set("color")}
            error={errors.color}
          />

          <div className="w-full">
            <label
              htmlFor="inventory-type"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Tipo
            </label>
            <select
              id="inventory-type"
              value={form.type}
              onChange={handleTypeChange}
              className={selectClass}
            >
              <option value="">Selecciona...</option>
              {PRODUCT_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1.5 text-sm text-error">{errors.type}</p>
            )}
          </div>

        </div>

        <div className="grid gap-4 sm:grid-cols-2">

          <div className="w-full">
            <label
              htmlFor="inventory-material"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Material
            </label>
            <select
              id="inventory-material"
              value={form.material}
              onChange={set("material")}
              disabled={!form.type}
              className={selectClass}
            >
              <option value="">
                {form.type ? "Selecciona..." : "Primero elige un tipo"}
              </option>
              {materialOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.material && (
              <p className="mt-1.5 text-sm text-error">{errors.material}</p>
            )}
          </div>

          <div className="w-full">
            <label
              htmlFor="inventory-gender"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Género
            </label>
            <select
              id="inventory-gender"
              value={form.gender}
              onChange={set("gender")}
              className={selectClass}
            >
              <option value="">Selecciona...</option>
              {GENDERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.gender && (
              <p className="mt-1.5 text-sm text-error">{errors.gender}</p>
            )}
          </div>

        </div>

        <Input
          label="Medidas"
          value={form.measurements}
          onChange={set("measurements")}
          error={errors.measurements}
          placeholder="Ej. 52-18-140"
        />

        <div className="w-full">
          <label className="mb-2 block text-sm font-medium text-text-primary">
            Fotos (máximo {MAX_PRODUCT_PHOTOS})
          </label>

          <div className="flex flex-wrap gap-3">

            {form.photos.map((src, index) => (
              <div
                key={index}
                className="relative h-24 w-24 overflow-hidden rounded-xl border border-gray-200"
              >
                <img
                  src={src}
                  alt={`Foto ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
                  aria-label="Quitar foto"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {form.photos.length < MAX_PRODUCT_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 text-text-secondary transition hover:border-indigo-primary hover:text-indigo-primary"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs">Agregar</span>
              </button>
            )}

          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            multiple
            className="hidden"
            onChange={handlePhotoSelect}
          />

          {errors.photos && (
            <p className="mt-1.5 text-sm text-error">{errors.photos}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">

          <Input
            label="Stock disponible"
            type="number"
            min="0"
            value={form.stockAvailable}
            onChange={set("stockAvailable")}
            error={errors.stockAvailable}
          />

          <Input
            label="Stock mínimo"
            type="number"
            min="0"
            value={form.stockMin}
            onChange={set("stockMin")}
            error={errors.stockMin}
          />

          <Input
            label="Costo"
            type="number"
            min="0"
            step="0.01"
            value={form.cost}
            onChange={set("cost")}
            error={errors.cost}
          />

        </div>

        {!isBranchScoped && (
          <div className="w-full">
            <label
              htmlFor="inventory-branch"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Sucursal
            </label>

            {isEdit ? (
              <div className="rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary opacity-50">
                {item?.branchName || "Sin asignar"}
              </div>
            ) : (
              <>
                <select
                  id="inventory-branch"
                  value={form.branchId}
                  onChange={set("branchId")}
                  disabled={loadingBranches}
                  className={selectClass}
                >
                  <option value="">
                    {loadingBranches ? "Cargando..." : "Selecciona..."}
                  </option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {errors.branchId && (
                  <p className="mt-1.5 text-sm text-error">{errors.branchId}</p>
                )}
              </>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
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
