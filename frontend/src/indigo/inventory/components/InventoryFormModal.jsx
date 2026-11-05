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
import { useFormValidation } from "../../../shared/hooks/useFormValidation";


// ============================================================================
// InventoryFormModal - formulario de alta/edición de producto de Indigo
// (~550 líneas, el componente más largo del módulo). La auditoría de
// arquitectura (04 nov 2026) lo señaló como candidato a partirse, pero se
// decidió posponerlo. Mapa rápido para quien lo vea primero:
//   - Carga de sucursales (líneas ~111-142): un efecto aparte, solo corre
//     si quien edita NO tiene su sucursal ya fija (ver `isBranchScoped`).
//   - Fotos (líneas ~159-197): 3 funciones juntas (`handlePhotoSelect`,
//     `removePhoto`, `readFileAsDataUrl` arriba del componente) - podrían
//     vivir en su propio componente de "subir fotos" si esto se separa.
//   - El resto del formulario (código, modelo, color, tipo/material,
//     género, medidas, stock/costo, sucursal) es estado plano, sin nada
//     particular - es la parte que menos necesita separarse.
// ============================================================================

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


// Convierte un archivo de imagen (del <input type="file">) a un data URL
// base64 - así las fotos se guardan como texto en `form.photos`, sin subir
// nada a un servidor de archivos todavía.
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


// Arma el estado del formulario: vacío para "Nuevo producto", o con los
// datos del item para "Editar producto". Siempre parte de EMPTY primero
// para que ningún campo quede undefined si el item no lo trae.
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

  // Estado del formulario en sí - todos los campos, planos (ver EMPTY).
  const [form, setForm] = useState(() => crearFormDesdeItem(item));
  // Errores de validación por campo, más `errors.submit` para el error
  // general si falla el guardado (ver handleSubmit más abajo).
  const { errors, setErrors, validate, clearError, clearErrors, resetErrors } = useFormValidation();
  const [saving, setSaving] = useState(false);
  // Sucursales para el <select> de abajo - solo se usan si NO es un
  // Gerente de sucursal (ver `isBranchScoped`: su sucursal ya está fija).
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Referencia al <input type="file"> oculto - se "hace clic" en él desde
  // el botón "Agregar" de la sección de fotos, en vez de mostrar el input
  // feo por default del navegador.
  const fileInputRef = useRef(null);

  const isEdit = mode === "edit";

  // Un Gerente de sucursal solo administra el inventario de SU sucursal -
  // no elige sucursal al crear/editar, y por eso tampoco ve esa sección
  // del formulario (ver el JSX más abajo, `{!isBranchScoped && (...)}`).
  const isBranchScoped =
    currentUser?.role === ROLES.INDIGO_GERENTE_SUCURSAL;

  // Las opciones de "Material" dependen del "Tipo" elegido (ej. los
  // materiales de un armazón no son los mismos que los de una mica) - por
  // eso se recalculan cada vez que cambia `form.type`.
  const materialOptions = MATERIALS_BY_TYPE[form.type] ?? [];

  const titles = {
    create: "Nuevo producto",
    edit: "Editar producto",
  };


  // Cada vez que se abre el modal (o cambia a qué item apunta), se vuelve
  // a armar el formulario desde cero - así no se queda con datos de la
  // última vez que se usó para otro producto.
  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(crearFormDesdeItem(item));
    resetErrors();
  }, [open, item, resetErrors]);


  // ----- Carga de sucursales (solo si quien edita no tiene la suya fija) -----
  // `active` evita la clásica carrera: si el modal se cierra (o cambia el
  // rol) antes de que la petición termine, la respuesta tardía ya no pisa
  // el estado de un modal que ni sigue abierto.
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


  // Helper genérico para cualquier campo de texto/select: actualiza
  // `form[field]` y borra su error de validación en cuanto la persona
  // empieza a corregirlo (en vez de esperar al siguiente submit).
  const set = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
    clearError(field);
  };


  // Cambiar el "Tipo" invalida el "Material" elegido (las opciones de
  // material dependen del tipo, ver `materialOptions` arriba) - por eso
  // aquí se limpia `material` además de actualizar `type`.
  const handleTypeChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, type: value, material: "" }));
    clearErrors(["type", "material"]);
  };


  // ----- Fotos: seleccionar, validar tipo/cantidad, y quitar -----
  // Se puede seleccionar más de un archivo a la vez (el input tiene
  // `multiple`), así que todo este flujo trabaja con arreglos.
  const handlePhotoSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    // Se limpia el input de inmediato - si no, elegir el mismo archivo dos
    // veces seguidas no dispara `onChange` la segunda vez.
    event.target.value = "";

    // Si ya no hay espacio (o no se eligió nada), no hay nada que hacer.
    const remainingSlots = MAX_PRODUCT_PHOTOS - form.photos.length;
    if (remainingSlots <= 0 || files.length === 0) {
      return;
    }

    // Solo se aceptan los tipos de imagen permitidos, y hasta donde
    // alcance el espacio restante.
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

    // Cada archivo aceptado se convierte a data URL (readFileAsDataUrl) y
    // se agrega al final de las fotos que ya había.
    const dataUrls = await Promise.all(accepted.map(readFileAsDataUrl));

    setForm((prev) => ({
      ...prev,
      photos: [...prev.photos, ...dataUrls],
    }));
  };


  // Quita una foto por su posición en el arreglo - el botón "X" de cada
  // miniatura llama a esto con su propio índice.
  const removePhoto = (index) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    // Los campos de texto se limpian (trim) antes de validar y de
    // mandarse - un campo con solo espacios no debe contar como lleno.
    const code = String(form.code ?? "").trim();
    const model = String(form.model ?? "").trim();
    const color = String(form.color ?? "").trim();
    const measurements = String(form.measurements ?? "").trim();

    // `branchId` solo es obligatorio al crear (no al editar) y solo si
    // quien edita no tiene su sucursal ya fija (`isBranchScoped`).
    const isValid = validate([
      ["code", !code, "El código es obligatorio."],
      ["model", !model, "El modelo es obligatorio."],
      ["color", !color, "El color es obligatorio."],
      ["type", !form.type, "Selecciona un tipo."],
      ["material", !form.material, "Selecciona un material."],
      ["gender", !form.gender, "Selecciona un género."],
      ["measurements", !measurements, "Indica las medidas."],
      ["stockAvailable", form.stockAvailable === "" || Number(form.stockAvailable) < 0, "Indica el stock disponible."],
      ["stockMin", form.stockMin === "" || Number(form.stockMin) < 0, "Indica el stock mínimo."],
      ["cost", form.cost === "" || Number(form.cost) < 0, "Indica el costo."],
      ["branchId", !isBranchScoped && !isEdit && !form.branchId, "Selecciona una sucursal."],
    ]);

    if (!isValid) {
      return;
    }

    try {
      setSaving(true);
      // Los campos numéricos (stock, costo) se mandan como Number, no
      // como el string que guarda el <input> - y `branchId` se manda como
      // null (no como "") si no aplica, para que el backend lo trate como
      // "sin sucursal" y no como un valor vacío.
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
    } catch {
      // Si `onSubmit` falla, el modal se queda abierto con este mensaje -
      // antes no había ningún aviso aquí (ver auditoría, sección "manejo
      // de errores").
      setErrors((prev) => ({ ...prev, submit: "No se pudo guardar el producto. Intenta de nuevo." }));
    } finally {
      setSaving(false);
    }
  };


  return (
    <Modal isOpen={open} onClose={onClose} title={titles[mode]} size="lg">

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Código + modelo */}
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

        {/* Descripción - único campo libre, sin validación de obligatorio */}
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

        {/* Color + tipo (el tipo decide qué materiales aparecen abajo) */}
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

        {/* Material (depende del tipo, deshabilitado hasta elegir uno) + género */}
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

        {/* Medidas - texto libre, ej. "52-18-140" (ancho-puente-varilla) */}
        <Input
          label="Medidas"
          value={form.measurements}
          onChange={set("measurements")}
          error={errors.measurements}
          placeholder="Ej. 52-18-140"
        />

        {/* Fotos - miniaturas de lo ya agregado + botón para subir más, hasta MAX_PRODUCT_PHOTOS */}
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

          {/* Input real, oculto - el botón "Agregar" de arriba lo activa por su ref */}
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

        {/* Stock disponible, stock mínimo y costo - los 3 numéricos */}
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

        {/* Sucursal - oculto para Gerente de sucursal (la suya ya está fija).
            Al editar se muestra como texto fijo, no se puede reasignar. */}
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

        {errors.submit && <p className="text-sm text-error">{errors.submit}</p>}

        {/* Cancelar/Guardar - "Guardar" se deshabilita mientras `saving` sea true */}
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


// Clase compartida por todos los <select> del formulario, para que se
// vean igual que los <Input> de shared/components/Input.
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
