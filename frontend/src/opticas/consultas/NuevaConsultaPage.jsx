import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileCheck, ShoppingCart, ClipboardList, User, Building2, StickyNote, Calendar, UserCog } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import Button from "../../shared/components/Button";
import Input from "../../shared/components/Input";
import SectionTitle from "../../shared/components/SectionTitle";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import { useAuth } from "../../shared/context/AuthContext";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { clinicalNotes } from "../../shared/utils/textInput";

import { getPatient } from "../pacientes/services/patientService";
import { createConsulta } from "./services/consultaService";
import { OJO_RANGES, DIP_RANGE } from "./constants";
import OjoGraduacionFields from "./components/OjoGraduacionFields";
import ConsultaPageDecoration from "./components/ConsultaPageDecoration";


const EMPTY_OJO = { esfera: "", cilindro: "", eje: "", adicion: "" };
const NOTES_MAX = 2000;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fieldKey(prefix, field) {
  return `${prefix}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
}

// Mismos rangos que valida el back (OJO_RANGES/DIP_RANGE, ver
// OjoGraduacionFields) - se validan aqui tambien para marcar el error en
// el campo exacto antes de mandar la peticion.
function ojoRangeChecks(prefix, ojo) {
  return Object.entries(OJO_RANGES).map(([field, [min, max]]) => {
    const raw = ojo[field];
    if (raw === "" || raw == null) return [fieldKey(prefix, field), false, ""];
    const num = Number(raw);
    const isEje = field === "eje";
    const invalid = Number.isNaN(num) || num < min || num > max || (isEje && !Number.isInteger(num));
    const message = isEje
      ? `El eje debe ser un número entero entre ${min}° y ${max}°.`
      : `Debe estar entre ${min} y ${max}.`;
    return [fieldKey(prefix, field), invalid, message];
  });
}


/**
 * "Nueva consulta" (examen de la vista) - pagina aparte (no modal), para
 * los 3 roles, accesible desde el boton "Nueva consulta" del detalle de
 * un cliente. Campos alineados 1:1 a crearConsultaBodySchema del back
 * (consultas.schema.js): clienteId (de la URL), sucursalId (la del
 * paciente), fechaExamen, od/oi{esfera,cilindro,eje,adicion}, dip,
 * observaciones.
 *
 * El back NO tiene "profesional" (lo infiere del usuario autenticado),
 * "agudeza visual" ni "nota para el paciente" por separado, y una
 * consulta no tiene estados de borrador - por eso no hay "Guardar
 * borrador" aqui. "Finalizar y registrar venta" guarda igual la consulta
 * y de ahi navega a Nueva venta con el mismo paciente ya seleccionado
 * (no hay relacion consulta-venta en el back, es solo un atajo del front).
 */
export default function NuevaConsultaPage() {

  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [patient, setPatient] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingPatient(true);
        setLoadError(null);
        const data = await getPatient(patientId);
        if (active) setPatient(data);
      } catch (err) {
        if (active) setLoadError(err);
      } finally {
        if (active) setLoadingPatient(false);
      }
    })();
    return () => { active = false; };
  }, [patientId]);

  const [examDate, setExamDate] = useState(todayISO());
  const [od, setOd] = useState(EMPTY_OJO);
  const [oi, setOi] = useState(EMPTY_OJO);
  const [dip, setDip] = useState("");
  const [notes, setNotes] = useState("");
  const { errors, validate, clearError, setErrors } = useFormValidation();
  const [saving, setSaving] = useState(false);

  const setOdField = (field, value) => {
    setOd((prev) => ({ ...prev, [field]: value }));
    clearError(fieldKey("od", field));
  };
  const setOiField = (field, value) => {
    setOi((prev) => ({ ...prev, [field]: value }));
    clearError(fieldKey("oi", field));
  };
  const setDipField = (value) => { setDip(value); clearError("dip"); };

  if (loadingPatient) return <LoadingSpinner />;
  if (loadError || !patient) return <ErrorState />;

  const [dipMin, dipMax] = DIP_RANGE;
  const dipInvalid = dip !== "" && (Number.isNaN(Number(dip)) || Number(dip) < dipMin || Number(dip) > dipMax);

  const handleSave = async (then) => {
    const isValid = validate([
      ["examDate", !examDate, "La fecha de la consulta es obligatoria."],
      ["examDate", Boolean(examDate) && new Date(examDate) > new Date(), "La fecha no puede ser futura."],
      ...ojoRangeChecks("od", od),
      ...ojoRangeChecks("oi", oi),
      ["dip", dipInvalid, `Debe estar entre ${dipMin} y ${dipMax} mm.`],
    ]);
    if (!isValid) return;

    try {
      setSaving(true);
      await createConsulta({
        branchId: patient.branchId,
        patientId: patient.id,
        examDate,
        od,
        oi,
        dip,
        notes,
      });

      if (then === "venta") {
        navigate("/opticas/ventas/nueva", { state: { branchId: patient.branchId, patientId: patient.id } });
      } else {
        navigate(`/opticas/pacientes`);
      }
    } catch {
      setErrors((prev) => ({ ...prev, submit: "No se pudo guardar la consulta. Intenta de nuevo." }));
    } finally {
      setSaving(false);
    }
  };

  return (

    <PageContainer
      title="Nueva consulta"
      description="Captura el examen visual del paciente."
      actions={
        <Button variant="outline" className="inline-flex items-center gap-2 py-2.5 text-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      }
    >

      <div className="relative overflow-hidden">

      <ConsultaPageDecoration />

      <div className="relative mx-auto max-w-3xl space-y-6">

        <div className="rounded-2xl border border-gray-200 bg-surface p-6">
          <SectionTitle icon={ClipboardList}>Datos de la consulta</SectionTitle>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-text-primary">
                <User className="h-3.5 w-3.5" /> Paciente
              </label>
              <div className="rounded-xl border border-indigo-light bg-indigo-light/40 px-4 py-3 font-medium text-indigo-primary">
                {patient.name}
              </div>
            </div>

            <Input
              label="Fecha de consulta *"
              type="date"
              value={examDate}
              onChange={(e) => { setExamDate(e.target.value); clearError("examDate"); }}
              error={errors.examDate}
            />

            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-text-primary">
                <UserCog className="h-3.5 w-3.5" /> Registrado por
              </label>
              <div className="rounded-xl border border-gray-200 bg-background px-4 py-3 text-text-secondary">
                {currentUser?.name ?? "—"}
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-text-primary">
                <Building2 className="h-3.5 w-3.5" /> Sucursal
              </label>
              <div className="rounded-xl border border-gray-200 bg-background px-4 py-3 text-text-secondary">
                {patient.branchName || "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-surface p-6">
          <SectionTitle icon={Calendar}>Graduación (Rx)</SectionTitle>
          <OjoGraduacionFields
            od={od}
            oi={oi}
            dip={dip}
            errors={errors}
            onChangeOd={setOdField}
            onChangeOi={setOiField}
            onChangeDip={setDipField}
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-surface p-6">
          <SectionTitle icon={StickyNote}>Observaciones</SectionTitle>
          <textarea
            value={notes}
            onChange={(e) => setNotes(clinicalNotes(e.target.value, NOTES_MAX))}
            rows={4}
            maxLength={NOTES_MAX}
            placeholder="Notas del examen visual, hallazgos, recomendaciones..."
            className="w-full resize-none rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light"
          />
          <p className="mt-1 text-xs text-text-secondary">
            Solo letras, números y los caracteres / ° : , . ; - _
            <span className="float-right">{notes.length}/{NOTES_MAX}</span>
          </p>
        </div>

        {errors.submit && <p className="text-sm text-error">{errors.submit}</p>}

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" disabled={saving} className="inline-flex items-center justify-center gap-2" onClick={() => handleSave("consulta")}>
            <FileCheck className="h-4 w-4" />
            {saving ? "Guardando..." : "Finalizar consulta"}
          </Button>
          <Button disabled={saving} className="inline-flex items-center justify-center gap-2" onClick={() => handleSave("venta")}>
            <ShoppingCart className="h-4 w-4" />
            {saving ? "Guardando..." : "Finalizar y registrar venta"}
          </Button>
        </div>

      </div>

      </div>

    </PageContainer>

  );

}
