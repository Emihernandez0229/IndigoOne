import { useEffect, useState } from "react";
import { UserPlus, User, Phone, Mail, Calendar, Building2, ShieldCheck } from "lucide-react";

import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import { useAuth } from "../../../shared/context/AuthContext";
import { ROLES } from "../../../shared/security/roles";
import { useFormValidation } from "../../../shared/hooks/useFormValidation";
import { onlyLetters, onlyDigits, isValidEmail, isValidPhone } from "../../../shared/utils/textInput";
import { listBranches } from "../../branches/services/branchService";


const NAME_MAX = 50;
const EMAIL_MAX = 60;


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


function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
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
 * Alta y edición de cliente para Ópticas - mismo estilo visual que
 * ClientFormPage de Indigo (secciones numeradas, panel de resumen), pero
 * con los campos propios del paciente (sin razón social/RFC/ubicación) y
 * sin la sección "Sucursal del cliente" de Indigo, que no aplica aquí.
 */
export default function PatientFormModal({
  open,
  mode = "create",
  patient = null,
  onClose,
  onSubmit,
}) {

  const { user: currentUser } = useAuth();

  const [form, setForm] = useState(() => crearFormDesdePaciente(patient));
  const { errors, validate, clearError, resetErrors } = useFormValidation();
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const isEdit = mode === "edit";

  const isBranchScoped =
    currentUser?.role === ROLES.OPTICA_ENCARGADO ||
    currentUser?.role === ROLES.OPTICA_EMPLEADO;

  const titles = {
    create: "Nuevo cliente",
    edit: "Editar cliente",
  };

  const submitLabels = {
    create: "Crear cliente",
    edit: "Guardar cambios",
  };


  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(crearFormDesdePaciente(patient));
    resetErrors();
  }, [open, patient, resetErrors]);


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


  if (!open) return null;

  const selectedBranch = branches.find((b) => b.id === form.branchId);

  const set = (field, transform) => (event) => {
    const raw = event?.target ? event.target.value : event;
    const value = transform ? transform(raw ?? "") : raw;
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
    clearError(field);
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = String(form.name ?? "").trim();
    const email = String(form.email ?? "").trim();

    const isValid = validate([
      ["name", !name, "El nombre es obligatorio."],
      ["phone", !isValidPhone(form.phone), "El teléfono debe tener exactamente 10 dígitos."],
      ["email", email && !isValidEmail(email), "El correo no es válido."],
      ["branchId", !isBranchScoped && !isEdit && !form.branchId, "Selecciona una sucursal."],
    ]);
    if (!isValid) return;

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
    <Modal isOpen={open} onClose={onClose} title={titles[mode]} size="xl">

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <div className="rounded-2xl border border-gray-200 bg-surface p-6">
            <SectionTitle icon={User} step={1} subtitle="Datos generales del cliente.">
              Información del cliente
            </SectionTitle>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input label="Nombre *" value={form.name} onChange={set("name", (v) => onlyLetters(v, NAME_MAX))} error={errors.name} />
              </div>
              <Input label="Teléfono *" value={form.phone} onChange={set("phone", (v) => onlyDigits(v, 10))} error={errors.phone} />
              <Input label="Correo electrónico" type="email" value={form.email} onChange={set("email", (v) => v.slice(0, EMAIL_MAX))} error={errors.email} />
              <Input
                label="Fecha de nacimiento"
                type="date"
                value={form.birthDate ?? ""}
                onChange={set("birthDate")}
                error={errors.birthDate}
              />

              {!isBranchScoped && (
                <div>
                  <label htmlFor="patient-branch" className="mb-2 block text-sm font-medium text-text-primary">
                    Sucursal {!isEdit ? "*" : ""}
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
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="inline-flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              {saving ? "Guardando..." : submitLabels[mode]}
            </Button>
          </div>

        </div>

        <div className="rounded-2xl border border-gray-200 bg-surface p-5">
          <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-text-primary">
            <ShieldCheck className="h-4 w-4 text-indigo-primary" />
            Cliente
          </h3>
          <p className="mb-4 text-sm text-text-secondary">Resumen de la información capturada.</p>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-light text-sm font-bold text-indigo-primary">
              {(form.name || "?").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-text-primary">{form.name || "Nombre"}</p>
            </div>
            <StatusBadge status="active" label="Activo" />
          </div>

          <dl className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
            <PreviewRow icon={Phone} label="Teléfono" value={form.phone} />
            <PreviewRow icon={Mail} label="Correo" value={form.email} />
            <PreviewRow icon={Calendar} label="Nacimiento" value={formatDate(form.birthDate)} />
          </dl>

          {!isBranchScoped && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-secondary">Sucursal</p>
              <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <Building2 className="h-4 w-4 text-text-secondary" />
                {isEdit ? (patient?.branchName || "—") : (selectedBranch?.name ?? "—")}
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
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-text-secondary">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="font-medium text-text-primary">{value || "—"}</span>
    </div>
  );
}
