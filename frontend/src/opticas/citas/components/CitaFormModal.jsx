import { useEffect, useRef, useState } from "react";
import { CalendarPlus, Search, User, Clock, MessageSquare, Building2, ShieldCheck } from "lucide-react";

import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { useAuth } from "../../../shared/context/AuthContext";
import { ROLES } from "../../../shared/security/roles";
import { useFormValidation } from "../../../shared/hooks/useFormValidation";
import { listBranches } from "../../branches/services/branchService";
import { listPatients, listAllPatients } from "../../pacientes/services/patientService";
import { alphanumericSpaces, textWithSpecialChars } from "../../../shared/utils/textInput";


const REASON_MAX = 200;


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


function formatDateTimePreview(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
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


function SectionTitle({ icon: Icon, children, subtitle, step }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-light text-sm font-bold text-indigo-primary">
        {step}
      </span>
      <div>
        <h3 className="flex items-center gap-2 text-base font-bold text-text-primary">
          <Icon className="h-4 w-4 text-indigo-primary" />
          {children}
        </h3>
        {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
      </div>
    </div>
  );
}


const selectClass = `
  w-full rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary
  outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light
  disabled:cursor-not-allowed disabled:opacity-50
`;


/**
 * Busca un paciente por nombre o teléfono en vez de elegirlo de una lista
 * larga - igual de utilidad que un <select>, pero escalable cuando hay
 * muchos pacientes registrados.
 */
function PatientSearchField({ patients, value, onSelect, disabled, error }) {

  const selected = patients.find((p) => p.id === value);

  const [query, setQuery] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);
  const closeTimeout = useRef(null);

  useEffect(() => () => clearTimeout(closeTimeout.current), []);

  const term = query.trim().toLowerCase();
  const matches = term
    ? patients.filter((p) => p.name.toLowerCase().includes(term) || (p.phone ?? "").includes(term))
    : patients;

  return (
    <div className="relative w-full">
      <label htmlFor="cita-patient" className="mb-2 block text-sm font-medium text-text-primary">
        Paciente *
      </label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <input
          id="cita-patient"
          type="text"
          value={query}
          disabled={disabled}
          placeholder={disabled ? "Selecciona primero una sucursal" : "Buscar paciente por nombre o teléfono..."}
          onChange={(event) => {
            setQuery(alphanumericSpaces(event.target.value, 50));
            setOpen(true);
            if (value) onSelect("");
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            closeTimeout.current = setTimeout(() => setOpen(false), 150);
          }}
          className={`${selectClass} pl-9`}
        />
      </div>

      {open && !disabled && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-gray-200 bg-surface shadow-lg">
          {matches.length === 0 ? (
            <p className="px-4 py-3 text-sm text-text-secondary">Sin resultados.</p>
          ) : (
            matches.map((patient) => (
              <button
                type="button"
                key={patient.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(patient.id);
                  setQuery(patient.name);
                  setOpen(false);
                }}
                className="block w-full px-4 py-2.5 text-left text-sm text-text-primary transition hover:bg-background"
              >
                {patient.name}
                {patient.phone && <span className="ml-2 text-xs text-text-secondary">{patient.phone}</span>}
              </button>
            ))
          )}
        </div>
      )}

      {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
    </div>
  );
}


/**
 * Alta y edición de cita para Ópticas - mismo estilo visual que los demás
 * formularios ya rediseñados (sección numerada + panel de resumen). El
 * paciente se busca por nombre en vez de elegirse de una lista larga.
 */
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
  const { errors, validate, clearError, resetErrors } = useFormValidation();
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchPatients, setBranchPatients] = useState(patients);

  const isEdit = mode === "edit";

  const titles = {
    create: "Nueva cita",
    edit: "Editar cita",
  };

  const submitLabels = {
    create: "Agendar cita",
    edit: "Guardar cambios",
  };


  useEffect(() => {
    if (!open) {
      return;
    }
    setForm({
      ...crearFormDesdeCita(cita),
      branchId: cita?.branchId ?? defaultBranchId,
    });
    resetErrors();
  }, [open, cita, defaultBranchId, resetErrors]);


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


  // Sin sucursal elegida (o "Sin sucursal" explicito) se buscan pacientes
  // de todas las sucursales, en vez de dejar la busqueda bloqueada.
  useEffect(() => {
    if (!open || !isOwner) {
      return;
    }
    let active = true;
    (async () => {
      try {
        const data = form.branchId ? await listPatients(form.branchId) : await listAllPatients();
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
  const selectedPatient = patientOptions.find((p) => p.id === form.patientId);


  const set = (field, transform) => (event) => {
    const raw = event?.target ? event.target.value : event;
    const value = transform ? transform(raw ?? "") : raw;
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
    clearError(field);
  };


  const handleBranchChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, branchId: value, patientId: "" }));
    clearError("branchId");
    clearError("patientId");
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    const reason = String(form.reason ?? "").trim();

    const dateTimeInvalid = !form.dateTime
      ? "required"
      : new Date(form.dateTime).getTime() <= Date.now()
        ? "past"
        : null;

    const isValid = validate([
      ["patientId", !isEdit && !form.patientId, "Selecciona un paciente."],
      ["dateTime", Boolean(dateTimeInvalid),
        dateTimeInvalid === "required" ? "Selecciona fecha y hora." : "La cita debe ser en una fecha futura."],
      ["reason", !reason, "El motivo es obligatorio."],
    ]);
    if (!isValid) return;

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
    <Modal isOpen={open} onClose={onClose} title={titles[mode]} size="xl">

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <div className="rounded-2xl border border-gray-200 bg-surface p-6">
            <SectionTitle icon={CalendarPlus} step={1} subtitle="Datos de la cita a agendar.">
              Información de la cita
            </SectionTitle>

            <div className="grid gap-4 sm:grid-cols-2">

              {isOwner && !isEdit && (
                <div className="sm:col-span-2">
                  <label htmlFor="cita-branch" className="mb-2 block text-sm font-medium text-text-primary">
                    Sucursal
                  </label>
                  <select id="cita-branch" value={form.branchId} onChange={handleBranchChange} className={selectClass}>
                    <option value="">Sin sucursal</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {!isEdit && (
                <div className="sm:col-span-2">
                  <PatientSearchField
                    patients={patientOptions}
                    value={form.patientId}
                    onSelect={(id) => setForm((prev) => ({ ...prev, patientId: id }))}
                    error={errors.patientId}
                  />
                </div>
              )}

              <Input
                label="Fecha y hora *"
                type="datetime-local"
                value={form.dateTime}
                onChange={set("dateTime")}
                error={errors.dateTime}
              />

              <div className="sm:col-span-2">
                <label htmlFor="cita-reason" className="mb-2 block text-sm font-medium text-text-primary">
                  Motivo *
                </label>
                <textarea
                  id="cita-reason"
                  value={form.reason}
                  onChange={set("reason", (v) => textWithSpecialChars(v, REASON_MAX))}
                  rows={3}
                  maxLength={REASON_MAX}
                  className={`${selectClass} resize-none`}
                />
                <p className="mt-1 text-right text-xs text-text-secondary">{form.reason.length}/{REASON_MAX}</p>
                {errors.reason && <p className="mt-1.5 text-sm text-error">{errors.reason}</p>}
              </div>

            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="inline-flex items-center gap-2">
              <CalendarPlus className="h-4 w-4" />
              {saving ? "Guardando..." : submitLabels[mode]}
            </Button>
          </div>

        </div>

        <div className="rounded-2xl border border-gray-200 bg-surface p-5">
          <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-text-primary">
            <ShieldCheck className="h-4 w-4 text-indigo-primary" />
            Cita
          </h3>
          <p className="mb-4 text-sm text-text-secondary">Resumen de la información capturada.</p>

          <dl className="space-y-2 text-sm">
            <PreviewRow icon={User} label="Paciente" value={isEdit ? (cita?.patientName ?? "—") : (selectedPatient?.name ?? "—")} />
            <PreviewRow icon={Clock} label="Fecha y hora" value={formatDateTimePreview(form.dateTime)} />
            <PreviewRow icon={MessageSquare} label="Motivo" value={form.reason} />
          </dl>

          {isOwner && !isEdit && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-secondary">Sucursal</p>
              <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <Building2 className="h-4 w-4 text-text-secondary" />
                {branches.find((b) => b.id === form.branchId)?.name ?? "—"}
              </span>
            </div>
          )}

        </div>

      </form>
    </Modal>
  );
}


function PreviewRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-text-secondary">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="truncate font-medium text-text-primary">{value || "—"}</span>
    </div>
  );
}
