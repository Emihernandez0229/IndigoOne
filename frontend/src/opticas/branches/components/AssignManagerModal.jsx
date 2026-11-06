import { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import Select from "../../../shared/components/Select";
import Button from "../../../shared/components/Button";
import { useFormValidation } from "../../../shared/hooks/useFormValidation";
import { listAvailableManagers } from "../services/branchService";


/**
 * Asignar/cambiar el jefe de sucursal - son 2 endpoints distintos en el
 * back (POST /sucursales/gerente si la sucursal no tiene gerente, PATCH
 * /sucursales/:id/gerente si ya tiene uno y se va a reemplazar), nunca el
 * mismo que edita nombre/dirección/teléfono. `branch.managerId` decide
 * cuál de los 2 se usa - lo controla el componente que llama a `onSubmit`.
 */
export default function AssignManagerModal({ open, branch, onClose, onSubmit }) {

  const isChange = Boolean(branch?.managerId);

  const [managerId, setManagerId] = useState("");
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const { errors, validate, clearError, resetErrors, setErrors } = useFormValidation();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setManagerId("");
    resetErrors();

    let active = true;
    (async () => {
      try {
        setLoadingManagers(true);
        const data = await listAvailableManagers();
        if (active) setManagers(Array.isArray(data) ? data : []);
      } catch {
        if (active) setManagers([]);
      } finally {
        if (active) setLoadingManagers(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, branch?.id]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const isValid = validate([["managerId", !managerId, "Selecciona un jefe de sucursal."]]);
    if (!isValid) return;

    try {
      setSaving(true);
      await onSubmit(managerId);
      onClose();
    } catch {
      setErrors((prev) => ({ ...prev, submit: "No se pudo guardar. Intenta de nuevo." }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={isChange ? "Cambiar jefe de sucursal" : "Asignar jefe de sucursal"} size="sm">

      <form onSubmit={handleSubmit} className="space-y-4">

        <p className="text-sm text-text-secondary">
          {isChange
            ? `"${branch?.manager}" dejará de ser el jefe de "${branch?.name}".`
            : `Elige quién va a gerenciar "${branch?.name}".`}
        </p>

        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">Jefe de sucursal</label>
          <Select value={managerId} onChange={(e) => { setManagerId(e.target.value); clearError("managerId"); }} disabled={loadingManagers}>
            <option value="">{loadingManagers ? "Cargando..." : "Selecciona un jefe de sucursal..."}</option>
            {managers.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </Select>
          {errors.managerId && <p className="mt-1.5 text-sm text-error">{errors.managerId}</p>}
          {!loadingManagers && managers.length === 0 && (
            <p className="mt-1.5 text-xs text-text-secondary">No hay jefes de sucursal disponibles para asignar.</p>
          )}
        </div>

        {errors.submit && <p className="text-sm text-error">{errors.submit}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </div>

      </form>

    </Modal>
  );

}
