import { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { COUNTRIES, getStatesForCountry, getMunicipalitiesForState } from "../../../shared/constants/locations";
import { listAvailableManagers } from "../services/branchService";


const EMPTY = {
  name: "",
  managerId: "",
  manager: "",
  country: "México",
  state: "",
  municipality: "",
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
    country: branch.country || "México",
    state: branch.state ?? "",
    municipality: branch.municipality ?? "",
  };
}


export default function BranchFormModal({
  open,
  mode = "create",
  branch = null,
  onClose,
  onSubmit,
}) {

  const [form, setForm] = useState(() => crearFormDesdeSucursal(branch));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  const isEdit = mode === "edit";

  const titles = {
    create: "Nueva sucursal",
    edit: "Editar sucursal",
  };

  const stateOptions = getStatesForCountry(form.country);
  const municipalityOptions = getMunicipalitiesForState(form.country, form.state);


  useEffect(() => {
    if (!open) return;
    setForm(crearFormDesdeSucursal(branch));
    setErrors({});
  }, [open, branch]);


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
        console.error("Error al cargar gerentes:", error);
        if (active) setManagers([]);
      } finally {
        if (active) setLoadingManagers(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [open, isEdit, branch?.managerId]);


  const set = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };


  const handleCountryChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, country: value, state: "", municipality: "" }));
    setErrors((prev) => ({ ...prev, country: undefined, state: undefined, municipality: undefined }));
  };


  const handleStateChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, state: value, municipality: "" }));
    setErrors((prev) => ({ ...prev, state: undefined, municipality: undefined }));
  };


  const handleManagerChange = (event) => {
    const value = event.target.value;
    const selected = managers.find((manager) => manager.id === value);

    setForm((prev) => ({
      ...prev,
      managerId: value,
      manager: selected?.nombre ?? "",
    }));
    setErrors((prev) => ({ ...prev, managerId: undefined }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    const name = String(form.name ?? "").trim();

    if (!name) nextErrors.name = "El nombre es obligatorio.";
    if (!form.managerId) nextErrors.managerId = "Selecciona un gerente disponible.";
    if (!form.country) nextErrors.country = "Selecciona un país.";
    if (!form.state) nextErrors.state = "Selecciona un estado.";
    if (!form.municipality) nextErrors.municipality = "Selecciona un municipio.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);
      await onSubmit({
        name,
        managerId: form.managerId,
        manager: form.manager,
        managerMode: "existing",
        country: form.country,
        state: form.state,
        municipality: form.municipality,
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
          onChange={set("name")}
          error={errors.name}
        />

        <div className="w-full">
          <label htmlFor="branch-manager" className="mb-2 block text-sm font-medium text-text-primary">
            Responsable (Gerente de Sucursal)
          </label>

          <select
            id="branch-manager"
            value={form.managerId ?? ""}
            onChange={handleManagerChange}
            disabled={loadingManagers}
            className={selectClass}
          >
            <option value="">
              {loadingManagers ? "Cargando..." : "Selecciona un gerente..."}
            </option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>{manager.nombre}</option>
            ))}
          </select>

          {errors.managerId && <p className="mt-1.5 text-sm text-error">{errors.managerId}</p>}

          {managers.length === 0 && !loadingManagers && (
            <p className="mt-1 text-xs text-text-secondary">
              No hay gerentes disponibles para asignar. Da de alta uno nuevo desde Usuarios primero.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">

          <div className="w-full">
            <label htmlFor="branch-country" className="mb-2 block text-sm font-medium text-text-primary">País</label>
            <select id="branch-country" value={form.country ?? ""} onChange={handleCountryChange} className={selectClass}>
              {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {errors.country && <p className="mt-1.5 text-sm text-error">{errors.country}</p>}
          </div>

          <div className="w-full">
            <label htmlFor="branch-state" className="mb-2 block text-sm font-medium text-text-primary">Estado</label>
            <select id="branch-state" value={form.state ?? ""} onChange={handleStateChange} className={selectClass}>
              <option value="">Selecciona...</option>
              {stateOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {errors.state && <p className="mt-1.5 text-sm text-error">{errors.state}</p>}
          </div>

          <div className="w-full">
            <label htmlFor="branch-municipality" className="mb-2 block text-sm font-medium text-text-primary">Municipio</label>
            <select
              id="branch-municipality"
              value={form.municipality ?? ""}
              onChange={set("municipality")}
              disabled={!form.state}
              className={selectClass}
            >
              <option value="">{form.state ? "Selecciona..." : "Primero elige un estado"}</option>
              {municipalityOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            {errors.municipality && <p className="mt-1.5 text-sm text-error">{errors.municipality}</p>}
          </div>

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
