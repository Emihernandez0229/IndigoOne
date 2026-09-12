import { useState } from "react";

import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({
  open,
  title = "¿Estás seguro?",
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  onConfirm,
  onClose,
}) {

  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={title} size="sm">

      <div className="space-y-6">

        {description && (
          <p className="text-sm text-text-secondary">
            {description}
          </p>
        )}

        <div className="flex justify-end gap-3">

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={variant}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Procesando..." : confirmLabel}
          </Button>

        </div>

      </div>

    </Modal>
  );

}
