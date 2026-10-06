import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import { ArrowLeft } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import EmptyState from "../../shared/components/EmptyState";
import StatusBadge from "../../shared/components/StatusBadge";
import Button from "../../shared/components/Button";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import Can from "../../shared/security/Can";

import { getOrder, updateOrderStatus } from "./services/laboratorioService";
import { getPatient } from "../pacientes/services/patientService";
import { STATUS_TRANSITIONS } from "./constants";


const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" });
};


export default function LaboratorioDetailPage() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);


  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrder(id);
      setOrder(data);
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
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);


  const handleStatusChange = async () => {
    const updated = await updateOrderStatus(id, pendingStatus.value);
    setOrder((prev) => ({ ...prev, ...updated }));
  };


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  if (!order) {
    return (
      <PageContainer title="Orden de laboratorio" description="">
        <EmptyState
          title="No encontramos esta orden"
          description="Puede que ya no exista."
        />
        <div className="mt-4">
          <Link to="/opticas/laboratorio" className="text-sm font-medium text-indigo-primary">
            ← Volver a laboratorio
          </Link>
        </div>
      </PageContainer>
    );
  }

  const transitions = STATUS_TRANSITIONS[order.status] ?? [];
  const receta = order.receta ?? {};


  return (

    <PageContainer
      title={patient?.name ?? "Orden de laboratorio"}
      description={formatDateTime(order.createdAt)}
      actions={
        <Button
          variant="outline"
          className="inline-flex items-center gap-2 py-2.5 text-sm"
          onClick={() => navigate("/opticas/laboratorio")}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      }
    >

      <div className="space-y-6">

        <div className="rounded-2xl border border-gray-200 bg-surface p-6">

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Información general</h2>
            <StatusBadge status={order.status} />
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
            <Field label="Paciente" value={patient?.name} />
            <Field label="Producto" value={order.items.map((item) => item.model || item.code).join(", ")} />
            <Field label="Fecha" value={formatDateTime(order.createdAt)} />
            <Field
              label="Venta relacionada"
              value={
                order.saleId ? (
                  <Link to={`/opticas/ventas/${order.saleId}`} className="text-indigo-primary hover:underline">
                    Ver venta
                  </Link>
                ) : null
              }
            />
          </dl>

          {order.notes && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-1 text-sm font-medium text-text-secondary">Observaciones</p>
              <p className="text-sm text-text-primary">{order.notes}</p>
            </div>
          )}

          {transitions.length > 0 && (
            <Can permission="optica.lab.manage">
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

        <div className="rounded-2xl border border-gray-200 bg-surface p-6">

          <h2 className="mb-4 text-lg font-semibold text-text-primary">Graduación</h2>

          <div className="grid gap-6 sm:grid-cols-2">

            <div>
              <p className="mb-2 text-sm font-semibold text-text-primary">Ojo derecho (OD)</p>
              <dl className="grid grid-cols-3 gap-3">
                <Field label="Esfera" value={receta.odEsfera} />
                <Field label="Cilindro" value={receta.odCilindro} />
                <Field label="Eje" value={receta.odEje} />
              </dl>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-text-primary">Ojo izquierdo (OI)</p>
              <dl className="grid grid-cols-3 gap-3">
                <Field label="Esfera" value={receta.oiEsfera} />
                <Field label="Cilindro" value={receta.oiCilindro} />
                <Field label="Eje" value={receta.oiEje} />
              </dl>
            </div>

          </div>

          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
            <Field label="Adición" value={receta.adicion} />
            <Field label="Distancia pupilar (DP)" value={receta.dp} />
          </dl>

        </div>

      </div>

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={pendingStatus?.label}
        description={`¿Seguro que quieres marcar esta orden como "${pendingStatus?.label?.toLowerCase()}"?`}
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
