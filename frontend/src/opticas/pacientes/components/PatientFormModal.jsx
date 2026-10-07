import { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { useAuth } from "../../../shared/context/AuthContext";
import { ROLES } from "../../../shared/security/roles";
import { listBranches } from "../../branches/services/branchService";


const EMPTY = {
  name: "",
  phone: "",
  email: "",
  birthDate: "",
  branchId: "",
};


function crearFormDesdePaciente(patient) {
  if (!patient) {
    return { ...EMPTY };
  }

  return {
    ...EMPTY,
    name: patient.name ?? "",
    phone: patient.phone ?? "",
    email: patient.email ?? "",
    birthDate: patient.birthDate ?? "",
    branchId: patient.branchId ?? "",
  };
}


export default function PatientFormModal({
  open,
  mode = "create",
  patient = null,
  onClose,
  onSubmit,
}) {

  const { user: currentUser } = useAuth();

  const [form, setForm] = useState(() => crearFormDesdePaciente(patient));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const isEdit = mode === "edit";

  const isBranchScoped =
    currentUser?.role === ROLES.OPTICA_ENCARGADO ||
    currentUser?.role === ROLES.OPTICA_EMPLEADO;

  const titles = {
    create: "Nuevo paciente",
    edit: "Editar paciente",
  };


  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(crearFormDesdePaciente(patient));
    setErrors({});
  }, [open, patient]);


  useEffect(() => {

    if (!open || isBranchScoped || isEdit) {
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

  }, [open, isBranchScoped, isEdit]);


  const set = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    const name = String(form.name ?? "").trim();
    const email = String(form.email ?? "").trim();

    if (!name) nextErrors.name = "El nombre es obligatorio.";

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = "El correo no es válido.";
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
        name,
        phone: String(form.phone ?? "").trim(),
        email,
        birthDate: form.birthDate || null,
        branchId: form.branchId || null,
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
          label="Nombre"
          value={form.name}
          onChange={set("name")}
          error={errors.name}
        />

        <div className="grid gap-4 sm:grid-cols-2">

          <Input
            label="Teléfono"
            value={form.phone}
            onChange={set("phone")}
            error={errors.phone}
          />

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={set("email")}
            error={errors.email}
          />

        </div>

        <Input
          label="Fecha de nacimiento"
          type="date"
          value={form.birthDate ?? ""}
          onChange={set("birthDate")}
          error={errors.birthDate}
        />

        {!isBranchScoped && (
          <div className="w-full">
            <label
              htmlFor="patient-branch"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Sucursal
            </label>

            {isEdit ? (
              <div className="rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary opacity-50">
                {patient?.branchName || "Sin asignar"}
              </div>
            ) : (
              <>
                <select
                  id="patient-branch"
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
