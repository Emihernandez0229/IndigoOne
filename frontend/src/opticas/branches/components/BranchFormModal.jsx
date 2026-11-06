import { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Select from "../../../shared/components/Select";
import Button from "../../../shared/components/Button";
import { onlyLetters } from "../../../shared/utils/textInput";
import { listAvailableManagers } from "../services/branchService";
import { useFormValidation } from "../../../shared/hooks/useFormValidation";


const NAME_MAX_LENGTH = 40;


const EMPTY = { name: "", managerId: "" };


function crearFormDesdeSucursal(branch) {
  if (!branch) return { ...EMPTY };
  return { ...EMPTY, name: branch.name ?? "" };
}


/**
 * Alta y edición de sucursal para el Dueño de óptica. El back no soporta
 * crear un jefe de sucursal nuevo al mismo tiempo que la sucursal
 * (crearSucursalSchema es estricto) - solo asignar uno que ya exista o
 * dejarla sin asignar (se asigna después desde "Asignar gerente"). Tampoco
 * soporta cambiar el gerente por esta misma ruta al editar - por eso el
 * selector de jefe de sucursal solo aparece al crear.
 * Dirección y teléfono no se capturan aquí - los agrega el Encargado desde
 * "Mi sucursal" (MyBranchEditModal), igual que en Indigo.
 */
export default function BranchFormModal({
  open,
  mode = "create",
  branch = null,
  onClose,
  onSubmit,
}) {

  const [form, setForm] = useState(() => crearFormDesdeSucursal(branch));
  const { errors, validate, clearError, resetErrors, setErrors } = useFormValidation();
  const [saving, setSaving] = useState(false);
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  const isCreate = mode === "create";

  const titles = {
    create: "Nueva sucursal",
    edit: "Editar sucursal",
  };


  useEffect(() => {
    if (!open) return;
    setForm(crearFormDesdeSucursal(branch));
    resetErrors();
  }, [open, branch, resetErrors]);


  useEffect(() => {
    if (!open || !isCreate) return;

    let active = true;

    (async () => {
      try {
        setLoadingManagers(true);
        const data = await listAvailableManagers();
        if (active) setManagers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error al cargar jefes de sucursal:", error);
        if (active) setManagers([]);
      } finally {
        if (active) setLoadingManagers(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [open, isCreate]);


  const set = (field, transform) => (event) => {
    const raw = event?.target ? event.target.value : event;
    const value = transform ? transform(raw ?? "") : raw;
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
    clearError(field);
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = String(form.name ?? "").trim();

    const isValid = validate([
      ["name", !name, "El nombre es obligatorio."],
    ]);
    if (!isValid) return;

    try {
      setSaving(true);
      await onSubmit({ name, managerId: isCreate ? form.managerId : undefined });
      onClose();
    } catch {
      setErrors((prev) => ({ ...prev, submit: "No se pudo guardar la sucursal. Intenta de nuevo." }));
    } finally {
      setSaving(false);
    }
  };


  return (
    <Modal isOpen={open} onClose={onClose} title={titles[mode]} size="lg">

      <form onSubmit={handleSubmit} className="space-y-4">

        <Input
          label="Nombre de sucursal"
          value={form.name ?? ""}
          onChange={set("name", (v) => onlyLetters(v, NAME_MAX_LENGTH))}
          error={errors.name}
        />

        {isCreate && (
          <div className="w-full">
            <label htmlFor="branch-manager" className="mb-2 block text-sm font-medium text-text-primary">
              Responsable (Jefe de Sucursal)
            </label>

            <Select
              id="branch-manager"
              value={form.managerId ?? ""}
              onChange={set("managerId")}
              disabled={loadingManagers}
            >
              <option value="">{loadingManagers ? "Cargando..." : "Sin asignar (se asigna después)"}</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>{manager.nombre}</option>
              ))}
            </Select>

            {!loadingManagers && managers.length === 0 && (
              <p className="mt-1.5 text-xs text-text-secondary">
                No hay jefes de sucursal disponibles - puedes asignar uno después desde el detalle de la sucursal.
              </p>
            )}
          </div>
        )}

        {errors.submit && <p className="text-sm text-error">{errors.submit}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </div>
      </form>
    </Modal>
  );
}
