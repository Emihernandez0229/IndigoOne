import { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { useAuth } from "../../../shared/context/AuthContext";
import { ROLES } from "../../../shared/security/roles";
import { listBranches } from "../../branches/services/branchService";
import { listPatients } from "../../pacientes/services/patientService";


const EMPTY = {
  patientId: "",
  dateTime: "",
  reason: "",
  branchId: "",
};


function toDatetimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}


function crearFormDesdeCita(cita) {
  if (!cita) {
    return { ...EMPTY };
  }

  return {
    ...EMPTY,
    patientId: cita.patientId ?? "",
    dateTime: toDatetimeLocal(cita.dateTime),
    reason: cita.reason ?? "",
    branchId: cita.branchId ?? "",
  };
}


export default function CitaFormModal({
  open,
  mode = "create",
  cita = null,
  patients = [],
  defaultBranchId = "",
  onClose,
  onSubmit,
}) {

  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.role === ROLES.OPTICA_DUENO;

  const [form, setForm] = useState(() => crearFormDesdeCita(cita));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchPatients, setBranchPatients] = useState(patients);

  const isEdit = mode === "edit";

  const titles = {
    create: "Nueva cita",
    edit: "Editar cita",
  };


  useEffect(() => {
    if (!open) {
      return;
    }
    setForm({
      ...crearFormDesdeCita(cita),
      branchId: cita?.branchId ?? defaultBranchId,
    });
    setErrors({});
  }, [open, cita, defaultBranchId]);


  useEffect(() => {
    if (!open || !isOwner) {
      return;
    }
    let active = true;
    (async () => {
      try {
        const data = await listBranches();
        if (active) setBranches(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error al cargar sucursales:", error);
        if (active) setBranches([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, isOwner]);


  useEffect(() => {
    if (!open || !isOwner || !form.branchId) {
      return;
    }
    let active = true;
    (async () => {
      try {
        const data = await listPatients(form.branchId);
        if (active) setBranchPatients(data);
      } catch (error) {
        console.error("Error al cargar pacientes:", error);
        if (active) setBranchPatients([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, isOwner, form.branchId]);


  const patientOptions = isOwner ? branchPatients : patients;


  const set = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };


  const handleBranchChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, branchId: value, patientId: "" }));
    setErrors((prev) => ({ ...prev, branchId: undefined, patientId: undefined }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    const reason = String(form.reason ?? "").trim();

    if (isOwner && !form.branchId) {
      nextErrors.branchId = "Selecciona una sucursal.";
    }

    if (!isEdit && !form.patientId) {
      nextErrors.patientId = "Selecciona un paciente.";
    }

    if (!form.dateTime) {
      nextErrors.dateTime = "Selecciona fecha y hora.";
    } else if (new Date(form.dateTime).getTime() <= Date.now()) {
      nextErrors.dateTime = "La cita debe ser en una fecha futura.";
    }

    if (!reason) {
      nextErrors.reason = "El motivo es obligatorio.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setSaving(true);
      await onSubmit({
        patientId: form.patientId,
        dateTime: new Date(form.dateTime).toISOString(),
        reason,
        branchId: form.branchId || defaultBranchId,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };


  return (
    <Modal isOpen={open} onClose={onClose} title={titles[mode]} size="lg">

      <form onSubmit={handleSubmit} className="space-y-4">

        {isOwner && !isEdit && (
          <div className="w-full">
            <label
              htmlFor="cita-branch"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Sucursal
            </label>
            <select
              id="cita-branch"
              value={form.branchId}
              onChange={handleBranchChange}
              className={selectClass}
            >
              <option value="">Selecciona...</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            {errors.branchId && (
              <p className="mt-1.5 text-sm text-error">{errors.branchId}</p>
            )}
          </div>
        )}

        {!isEdit && (
          <div className="w-full">
            <label
              htmlFor="cita-patient"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Paciente
            </label>
            <select
              id="cita-patient"
              value={form.patientId}
              onChange={set("patientId")}
              disabled={isOwner && !form.branchId}
              className={selectClass}
            >
              <option value="">Selecciona...</option>
              {patientOptions.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
            {errors.patientId && (
              <p className="mt-1.5 text-sm text-error">{errors.patientId}</p>
            )}
          </div>
        )}

        <Input
          label="Fecha y hora"
          type="datetime-local"
          value={form.dateTime}
          onChange={set("dateTime")}
          error={errors.dateTime}
        />

        <div className="w-full">
          <label
            htmlFor="cita-reason"
            className="mb-2 block text-sm font-medium text-text-primary"
          >
            Motivo
          </label>
          <textarea
            id="cita-reason"
            value={form.reason}
            onChange={set("reason")}
            rows={3}
            className={`${selectClass} resize-none`}
          />
          {errors.reason && (
            <p className="mt-1.5 text-sm text-error">{errors.reason}</p>
          )}
        </div>

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
