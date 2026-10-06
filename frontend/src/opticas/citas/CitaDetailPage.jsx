import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import { ArrowLeft, Pencil } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import EmptyState from "../../shared/components/EmptyState";
import StatusBadge from "../../shared/components/StatusBadge";
import Button from "../../shared/components/Button";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import Can from "../../shared/security/Can";

import { getCita, updateCita, updateCitaStatus } from "./services/citaService";
import { getPatient } from "../pacientes/services/patientService";
import { STATUS_TRANSITIONS, EDITABLE_STATUSES } from "./constants";
import CitaFormModal from "./components/CitaFormModal";


const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" });
};


export default function CitaDetailPage() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [cita, setCita] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);


  const loadCita = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCita(id);
      setCita(data);
      if (data?.patientId) {
        try {
          setPatient(await getPatient(data.patientId));
        } catch {
          setPatient(null);
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCita();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);


  const handleEditSubmit = async (payload) => {
    const updated = await updateCita(id, payload);
    setCita((prev) => ({ ...prev, ...updated }));
  };

  const handleStatusChange = async () => {
    const updated = await updateCitaStatus(id, pendingStatus.value);
    setCita((prev) => ({ ...prev, ...updated }));
  };


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  if (!cita) {
    return (
      <PageContainer title="Cita" description="">
        <EmptyState
          title="No encontramos esta cita"
          description="Puede que ya no exista."
        />
        <div className="mt-4">
          <Link to="/opticas/citas" className="text-sm font-medium text-indigo-primary">
            ← Volver a citas
          </Link>
        </div>
      </PageContainer>
    );
  }

  const transitions = STATUS_TRANSITIONS[cita.status] ?? [];
  const isEditable = EDITABLE_STATUSES.includes(cita.status);


  return (

    <PageContainer
      title={patient?.name ?? "Cita"}
      description={formatDateTime(cita.dateTime)}
      actions={
        <div className="flex items-center gap-2">
          {isEditable && (
            <Can permission="optica.appointment.manage">
              <Button
                variant="outline"
                className="inline-flex items-center gap-2 py-2.5 text-sm"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Can>
          )}
          <Button
            variant="outline"
            className="inline-flex items-center gap-2 py-2.5 text-sm"
            onClick={() => navigate("/opticas/citas")}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
      }
    >

      <div className="rounded-2xl border border-gray-200 bg-surface p-6">

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Información general</h2>
          <StatusBadge status={cita.status} />
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <Field label="Paciente" value={patient?.name} />
          <Field label="Teléfono" value={patient?.phone} />
          <Field label="Fecha y hora" value={formatDateTime(cita.dateTime)} />
        </dl>

        {cita.reason && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="mb-1 text-sm font-medium text-text-secondary">Motivo</p>
            <p className="text-sm text-text-primary">{cita.reason}</p>
          </div>
        )}

        {transitions.length > 0 && (
          <Can permission="optica.appointment.manage">
            <div className="mt-6 border-t border-gray-100 pt-4">
              <p className="mb-3 text-sm font-medium text-text-secondary">Cambiar estado</p>
              <div className="flex flex-wrap gap-3">
                {transitions.map((transition) => (
                  <Button
                    key={transition.value}
                    type="button"
                    variant={transition.variant}
                    onClick={() => setPendingStatus(transition)}
                  >
                    {transition.label}
                  </Button>
                ))}
              </div>
            </div>
          </Can>
        )}

      </div>

      <CitaFormModal
        key={`edit-${cita.id}-${editOpen}`}
        open={editOpen}
        mode="edit"
        cita={cita}
        patients={[]}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={pendingStatus?.label}
        description={`¿Seguro que quieres marcar esta cita como "${pendingStatus?.label?.toLowerCase()}"? Esta acción no se puede deshacer.`}
        confirmLabel={pendingStatus?.label}
        variant={pendingStatus?.variant === "danger" ? "danger" : "primary"}
        onConfirm={handleStatusChange}
        onClose={() => setPendingStatus(null)}
      />

    </PageContainer>

  );

}


function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="mt-1 text-sm text-text-primary">{value || "—"}</dd>
    </div>
  );
}
