import { useState } from "react";
import { Wallet, User, Banknote } from "lucide-react";

import StatusBadge from "../../../shared/components/StatusBadge";
import Button from "../../../shared/components/Button";


const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;


/**
 * Vista dedicada para liquidar (total o parcialmente) el saldo pendiente
 * de una venta - reemplaza al detalle mientras esta abierta, dentro del
 * mismo SidePanel. Solo efectivo (unico metodo de pago que existe en
 * Ventas).
 */
export default function LiquidarSaldoPanel({ venta, onCancel, onConfirm }) {

  const [amount, setAmount] = useState(() => String(venta?.saldoPendiente ?? 0));
  const [saving, setSaving] = useState(false);

  if (!venta) return null;

  const monto = Math.max(0, Math.min(Number(amount) || 0, venta.saldoPendiente));
  const isFull = monto > 0 && monto >= venta.saldoPendiente;
  const saldoRestante = Math.max(0, venta.saldoPendiente - monto);
  const pagoDespues = saldoRestante <= 0 ? "liquidada" : "en_adeudo";

  const handleConfirm = async () => {
    try {
      setSaving(true);
      await onConfirm(monto);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-light text-indigo-primary">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Liquidar saldo</h2>
            <p className="text-sm text-text-secondary">Registrar pago de una venta</p>
          </div>
        </div>
        <StatusBadge status={venta.status} />
      </div>

      <div className="space-y-3 rounded-2xl bg-indigo-light/30 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Folio de venta</span>
          <span className="font-bold text-text-primary">{venta.folio}</span>
        </div>
        <div className="flex items-center gap-3 border-t border-indigo-light pt-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-indigo-primary">
            <User className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-text-primary">{venta.patientName || "Público general"}</p>
            <p className="truncate text-xs text-text-secondary">{[venta.branchName, venta.sellerName].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-text-primary">Resumen de la venta</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-text-secondary">
            <span>Total de la venta</span>
            <span className="font-medium text-text-primary">{currency(venta.total)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Monto abonado anteriormente</span>
            <span className="font-medium text-success">{currency(venta.montoPagado)}</span>
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-background px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Saldo pendiente</p>
          <p className="text-xl font-bold text-text-primary">{currency(venta.saldoPendiente)}</p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-text-primary">Registrar pago</h3>

        <label htmlFor="liquidar-amount" className="mb-2 block text-sm font-medium text-text-primary">
          Monto a pagar (MXN)
        </label>
        <input
          id="liquidar-amount"
          type="number"
          min="0"
          max={venta.saldoPendiente}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light"
        />

        <button
          type="button"
          onClick={() => setAmount(String(venta.saldoPendiente))}
          className="mt-2 text-sm font-semibold text-indigo-primary hover:underline"
        >
          Liquidar saldo completo · {currency(venta.saldoPendiente)}
        </button>
        <p className="mt-1 text-xs text-text-secondary">
          {isFull ? "Este pago cubrirá el saldo completo." : "Ingresa el importe recibido."}
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-text-primary">Método de pago</h3>
        <div className="flex items-center gap-3 rounded-xl border border-indigo-primary bg-indigo-light/30 px-4 py-3">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-indigo-primary">
            <span className="h-2 w-2 rounded-full bg-indigo-primary" />
          </span>
          <Banknote className="h-4 w-4 text-indigo-primary" />
          <span className="text-sm font-medium text-text-primary">Efectivo</span>
        </div>
      </div>

      <div className="space-y-2 rounded-xl bg-background p-4 text-sm">
        <div className="flex justify-between text-text-secondary">
          <span>Pago que se registrará</span>
          <span className="font-semibold text-text-primary">{currency(monto)}</span>
        </div>
        <div className="flex justify-between text-text-secondary">
          <span>Saldo restante</span>
          <span className="font-semibold text-success">{currency(saldoRestante)}</span>
        </div>
        <div className="flex items-center justify-between text-text-secondary">
          <span>Estado después del pago</span>
          <StatusBadge status={pagoDespues} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 justify-center" onClick={onCancel}>
          Cancelar
        </Button>
        <Button className="flex-1 justify-center" disabled={saving || monto <= 0} onClick={handleConfirm}>
          {saving ? "Guardando..." : "Confirmar pago"}
        </Button>
      </div>

    </div>
  );

}
