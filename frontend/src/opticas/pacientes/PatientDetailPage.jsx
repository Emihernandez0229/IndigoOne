import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import { ArrowLeft, Pencil } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import EmptyState from "../../shared/components/EmptyState";
import StatusBadge from "../../shared/components/StatusBadge";
import Button from "../../shared/components/Button";
import Can from "../../shared/security/Can";

import { getPatient, updatePatient } from "./services/patientService";
import PatientFormModal from "./components/PatientFormModal";


const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-MX");
};


export default function PatientDetailPage() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPatient(id);
        if (active) setPatient(data);
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);


  const handleEditSubmit = async (payload) => {
    const updated = await updatePatient(id, payload);
    setPatient((prev) => ({ ...prev, ...updated }));
  };


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  if (!patient) {
    return (
      <PageContainer title="Paciente" description="">
        <EmptyState
          title="No encontramos este paciente"
          description="Puede que ya lo hayan quitado del registro."
        />
        <div className="mt-4">
          <Link to="/opticas/pacientes" className="text-sm font-medium text-indigo-primary">
            ← Volver a pacientes
          </Link>
        </div>
      </PageContainer>
    );
  }


  return (

    <PageContainer
      title={patient.name}
      description={patient.branchName ? `Sucursal ${patient.branchName}` : ""}
      actions={
        <div className="flex items-center gap-2">
          <Can permission="optica.patient.update">
            <Button
              variant="outline"
              className="inline-flex items-center gap-2 py-2.5 text-sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </Can>
          <Button
            variant="outline"
            className="inline-flex items-center gap-2 py-2.5 text-sm"
            onClick={() => navigate("/opticas/pacientes")}
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
          <StatusBadge
            status={patient.active ? "active" : "inactive"}
            label={patient.active ? "Activo" : "Inactivo"}
          />
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <Field label="Nombre" value={patient.name} />
          <Field label="Teléfono" value={patient.phone} />
          <Field label="Email" value={patient.email} />
          <Field label="Fecha de nacimiento" value={formatDate(patient.birthDate)} />
          <Field label="Sucursal" value={patient.branchName} />
          <Field label="Fecha de registro" value={formatDate(patient.createdAt)} />
        </dl>

      </div>

      <PatientFormModal
        key={`edit-${patient.id}-${editOpen}`}
        open={editOpen}
        mode="edit"
        patient={patient}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
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
