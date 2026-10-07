import { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import Button from "../../../shared/components/Button";
import { PAYMENT_METHODS } from "../constants";


const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;


export default function PaymentModal({
  open,
  total = 0,
  onClose,
  onConfirm,
}) {

  const [mode, setMode] = useState("full");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setMode("full");
    setPaymentMethod("efectivo");
    setAmount(String(total));
  }, [open, total]);

  const montoPagado = mode === "full" ? total : Number(amount) || 0;
  const saldoPendiente = Math.max(0, total - montoPagado);

  const handleFinalizar = async () => {
    try {
      setSaving(true);
      await onConfirm({
        paymentMethod,
        montoPagado: mode === "full" ? total : montoPagado,
        saldoPendiente: mode === "full" ? 0 : saldoPendiente,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };


  return (
    <Modal isOpen={open} onClose={onClose} title="Registro de pago" size="sm">

      <div className="space-y-5">

        <div className="rounded-xl bg-background p-4">
          <p className="text-sm text-text-secondary">Total de la venta</p>
          <p className="text-2xl font-bold text-text-primary">{currency(total)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-background p-1">
          <button
            type="button"
            onClick={() => setMode("full")}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              mode === "full" ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary"
            }`}
          >
            Liquidar total
          </button>
          <button
            type="button"
            onClick={() => setMode("partial")}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              mode === "partial" ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary"
            }`}
          >
            Pago parcial
          </button>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-text-primary">Método de pago</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => setPaymentMethod(method.value)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                  paymentMethod === method.value
                    ? "border-indigo-primary bg-indigo-light text-indigo-primary"
                    : "border-gray-200 text-text-secondary hover:border-indigo-primary"
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {mode === "partial" && (
          <div className="space-y-3">
            <div>
              <label htmlFor="payment-amount" className="mb-2 block text-sm font-medium text-text-primary">
                Monto a pagar
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                <input
                  id="payment-amount"
                  type="number"
                  min="0"
                  max={total}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-surface py-3 pl-8 pr-4 text-text-primary outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light"
                />
              </div>
            </div>

            <div className="space-y-1 rounded-xl bg-background p-4 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Total</span>
                <span>{currency(total)}</span>
              </div>
              <div className="flex justify-between font-medium text-success">
                <span>Monto recibido</span>
                <span>{currency(montoPagado)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1 font-bold text-success">
                <span>Saldo pendiente</span>
                <span>{currency(saldoPendiente)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-success hover:opacity-90"
            disabled={saving || (mode === "partial" && montoPagado <= 0)}
            onClick={handleFinalizar}
          >
            {saving ? "Guardando..." : "Finalizar venta"}
          </Button>
        </div>

      </div>

    </Modal>
  );
}
