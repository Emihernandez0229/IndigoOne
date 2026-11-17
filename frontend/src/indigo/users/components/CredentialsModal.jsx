import { useState } from "react";
import { Lock, Eye, EyeOff, User, CheckCircle2 } from "lucide-react";

import Modal from "../../../shared/components/Modal";
import Button from "../../../shared/components/Button";


/**
 * Muestra la credencial que generó el back al crear una cuenta.
 * Se ve una sola vez: después ya no es posible recuperarla.
 */
export default function CredentialsModal({ open, user, onClose }) {

  const [showPassword, setShowPassword] = useState(false);

  if (!open || !user) return null;

  const credential = user.credencial_provisional;

  return (
    <Modal isOpen={open} onClose={onClose} title="Cuenta creada" size="sm">
      <div className="space-y-5">

        <div className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" />
          {user.name} fue dado de alta correctamente.
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">Usuario</label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-background px-4 py-3 font-mono text-text-primary">
            <User className="h-4 w-4 text-text-secondary" />
            {credential}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">Contraseña temporal</label>
          <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-background px-4 py-3">
            <span className="flex items-center gap-2 font-mono text-text-primary">
              <Lock className="h-4 w-4 text-text-secondary" />
              {showPassword ? credential : "•".repeat(credential.length)}
            </span>
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-text-secondary hover:text-text-primary">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-text-secondary">
            Compártela ahora con {user.name}: no podrás volver a verla después de cerrar esta ventana.
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={onClose}>Cerrar</Button>
        </div>

      </div>
    </Modal>
  );
}