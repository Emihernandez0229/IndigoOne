import { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { onlyLetters } from "../../../shared/utils/textInput";
import { listAvailableManagers } from "../services/branchService";
import { useFormValidation } from "../../../shared/hooks/useFormValidation";


const NAME_MAX_LENGTH = 40;


const EMPTY = {
  name: "",
  managerId: "",
  manager: "",
  managerMode: "existing",
};


function crearFormDesdeSucursal(branch) {

  if (!branch) {
    return { ...EMPTY };
  }

  return {
    ...EMPTY,
    name: branch.name ?? "",
    managerId: branch.managerId ?? "",
    manager: branch.manager ?? "",
  };
}


/**
 * Alta y edición de sucursal para el Dueño de óptica - mismo patrón que
 * BranchFormModal de Indigo: nombre, responsable (jefe de sucursal
 * existente o nuevo) y ubicación en cascada (país/estado/municipio).
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
  const { errors, validate, clearError, resetErrors } = useFormValidation();
  const [saving, setSaving] = useState(false);
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  const isEdit = mode === "edit";

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

    if (!open) return;

    let active = true;

    (async () => {
      try {
        setLoadingManagers(true);
        const data = await listAvailableManagers(isEdit ? branch?.managerId : null);
        if (active) {
          setManagers(Array.isArray(data) ? data : []);
        }
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
  }, [open, isEdit, branch?.managerId]);


  const set = (field, transform) => (event) => {
    const raw = event?.target ? event.target.value : event;
    const value = transform ? transform(raw ?? "") : raw;
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
    clearError(field);
  };


  const handleManagerChange = (event) => {
    const value = event.target.value;
    const selected = managers.find((manager) => manager.id === value);

    setForm((prev) => ({
      ...prev,
      managerId: value,
      manager: selected?.nombre ?? "",
    }));
    clearError("managerId");
  };


  const startNewManager = () => {
    setForm((prev) => ({ ...prev, managerMode: "new", managerId: "", manager: "" }));
    clearError("managerId");
  };


  const cancelNewManager = () => {
    setForm((prev) => ({ ...prev, managerMode: "existing", manager: "" }));
    clearError("managerId");
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = String(form.name ?? "").trim();
    const newManagerName = String(form.manager ?? "").trim();

    const isValid = validate([
      ["name", !name, "El nombre es obligatorio."],
      ["managerId", form.managerMode === "new" ? !newManagerName : !form.managerId,
        form.managerMode === "new" ? "Escribe el nombre del nuevo jefe de sucursal." : "Selecciona un jefe de sucursal disponible."],
    ]);
    if (!isValid) return;

    try {
      setSaving(true);
      await onSubmit({
        name,
        managerId: form.managerId,
        manager: form.managerMode === "new" ? newManagerName : form.manager,
        managerMode: form.managerMode,
      });
      onClose();
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

        <div className="w-full">
          <label htmlFor="branch-manager" className="mb-2 block text-sm font-medium text-text-primary">
            Responsable (Jefe de Sucursal)
          </label>

          {form.managerMode === "new" ? (
            <>
              <Input
                id="branch-manager"
                placeholder="Nombre del nuevo jefe de sucursal"
                value={form.manager ?? ""}
                onChange={set("manager", (v) => onlyLetters(v, NAME_MAX_LENGTH))}
                error={errors.managerId}
              />
              <button
                type="button"
                onClick={cancelNewManager}
                className="mt-1.5 text-xs font-medium text-indigo-primary hover:underline"
              >
                Elegir un jefe de sucursal existente
              </button>
            </>
          ) : (
            <>
              <select
                id="branch-manager"
                value={form.managerId ?? ""}
                onChange={handleManagerChange}
                disabled={loadingManagers}
                className={selectClass}
              >
                <option value="">
                  {loadingManagers ? "Cargando..." : "Selecciona un jefe de sucursal..."}
                </option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>{manager.nombre}</option>
                ))}
              </select>

              {errors.managerId && <p className="mt-1.5 text-sm text-error">{errors.managerId}</p>}

              {!loadingManagers && (
                <div className="mt-2">
                  {managers.length === 0 && (
                    <p className="mb-2 text-xs text-text-secondary">
                      No hay jefes de sucursal disponibles para asignar.
                    </p>
                  )}
                  <Button type="button" variant="outline" className="py-2 text-sm" onClick={startNewManager}>
                    + Nuevo jefe de sucursal
                  </Button>
                </div>
              )}
            </>
          )}
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
