import { useState } from "react";
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2 } from "lucide-react";

import Modal from "../../../../shared/components/Modal";
import Button from "../../../../shared/components/Button";


function generatePassword() {
  return Math.random().toString(36).slice(-8);
}


/**
 * Restablecer contraseña (Super usuario, modulo "Personal"). Nunca muestra
 * la contraseña actual (ni existe forma de verla) - solo genera una nueva
 * temporal que se muestra UNA sola vez, y la cuenta queda obligada a
 * cambiarla en su siguiente inicio de sesión.
 */
export default function ResetPasswordModal({ open, user, onClose, onConfirm }) {

  const [step, setStep] = useState("confirm");
  const [tempPassword, setTempPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  if (open && !wasOpen) {
    setWasOpen(true);
    setStep("confirm");
    setShowPassword(false);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  if (!open || !user) return null;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm(user);
      setTempPassword(generatePassword());
      setStep("done");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Restablecer contraseña" size="sm">

      {step === "confirm" ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl bg-indigo-light/40 p-4">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-indigo-primary" />
            <p className="text-sm text-text-primary">
              Se generará una contraseña temporal para <strong>{user.name}</strong> ({user.username}).
              Nunca es posible ver su contraseña actual; deberá cambiarla en su siguiente inicio de sesión.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="button" onClick={handleConfirm} disabled={saving} className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {saving ? "Generando..." : "Restablecer contraseña"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" />
            Contraseña restablecida correctamente.
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">Contraseña temporal</label>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-background px-4 py-3">
              <span className="flex items-center gap-2 font-mono text-text-primary">
                <Lock className="h-4 w-4 text-text-secondary" />
                {showPassword ? tempPassword : "•".repeat(tempPassword.length)}
              </span>
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-text-secondary hover:text-text-primary">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 text-xs text-text-secondary">
              Compártela ahora con {user.name}: no podrás volver a verla después de cerrar esta ventana.
              Deberá cambiarla al iniciar sesión.
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      )}

    </Modal>
  );

}
