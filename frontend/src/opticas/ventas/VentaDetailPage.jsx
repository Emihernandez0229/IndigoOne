import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import { ArrowLeft, Ban } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import EmptyState from "../../shared/components/EmptyState";
import StatusBadge from "../../shared/components/StatusBadge";
import Button from "../../shared/components/Button";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import Can from "../../shared/security/Can";

import { getVenta, cancelVenta } from "./services/ventaService";
import { getPatient } from "../pacientes/services/patientService";
import { PAYMENT_METHODS } from "./constants";


const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" });
};

const paymentLabel = (value) =>
  PAYMENT_METHODS.find((option) => option.value === value)?.label ?? value;


export default function VentaDetailPage() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [venta, setVenta] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);


  const loadVenta = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getVenta(id);
      setVenta(data);
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
    loadVenta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);


  const handleCancel = async () => {
    const updated = await cancelVenta(id);
    setVenta((prev) => ({ ...prev, ...updated }));
  };


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  if (!venta) {
    return (
      <PageContainer title="Venta" description="">
        <EmptyState
          title="No encontramos esta venta"
          description="Puede que ya no exista."
        />
        <div className="mt-4">
          <Link to="/opticas/ventas" className="text-sm font-medium text-indigo-primary">
            ← Volver a ventas
          </Link>
        </div>
      </PageContainer>
    );
  }


  return (

    <PageContainer
      title={`Venta ${formatDateTime(venta.createdAt)}`}
      description={patient?.name ?? "Público general"}
      actions={
        <div className="flex items-center gap-2">
          {venta.status === "completada" && (
            <Can permission="optica.sales.manage">
              <Button
                variant="danger"
                className="inline-flex items-center gap-2 py-2.5 text-sm"
                onClick={() => setConfirmCancel(true)}
              >
                <Ban className="h-4 w-4" />
                Cancelar venta
              </Button>
            </Can>
          )}
          <Button
            variant="outline"
            className="inline-flex items-center gap-2 py-2.5 text-sm"
            onClick={() => navigate("/opticas/ventas")}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
      }
    >

      <div className="space-y-6">

        <div className="rounded-2xl border border-gray-200 bg-surface p-6">

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Información general</h2>
            <StatusBadge status={venta.status} />
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
            <Field label="Paciente" value={patient?.name ?? "Público general"} />
            <Field label="Método de pago" value={paymentLabel(venta.paymentMethod)} />
            <Field label="Fecha" value={formatDateTime(venta.createdAt)} />
            <Field label="Monto pagado" value={currency(venta.montoPagado)} />
            {venta.saldoPendiente > 0 && (
              <Field label="Saldo pendiente" value={currency(venta.saldoPendiente)} />
            )}
          </dl>

        </div>

        <div className="rounded-2xl border border-gray-200 bg-surface p-6">

          <h2 className="mb-4 text-lg font-semibold text-text-primary">Productos</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
                  <th className="pb-3 pr-4">Producto</th>
                  <th className="pb-3 pr-4">Código</th>
                  <th className="pb-3 pr-4">Cantidad</th>
                  <th className="pb-3 pr-4">Precio unitario</th>
                  <th className="pb-3">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {venta.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-4 font-medium text-text-primary">{item.model}</td>
                    <td className="py-3 pr-4 text-text-secondary">{item.code}</td>
                    <td className="py-3 pr-4">{item.quantity}</td>
                    <td className="py-3 pr-4">{currency(item.unitPrice)}</td>
                    <td className="py-3 font-medium text-text-primary">{currency(item.quantity * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
            <div className="w-48 space-y-1 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>{currency(venta.subtotal)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>IVA</span>
                <span>{currency(venta.iva)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-1 text-base font-bold text-text-primary">
                <span>Total</span>
                <span>{currency(venta.total)}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancelar venta"
        description={`¿Seguro que quieres cancelar esta venta por ${currency(venta.total)}? Se repondrá el stock de los productos vendidos.`}
        confirmLabel="Cancelar venta"
        variant="danger"
        onConfirm={handleCancel}
        onClose={() => setConfirmCancel(false)}
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
