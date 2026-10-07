import { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { EMPTY_RECETA } from "../constants";


export default function RecetaFormModal({
  open,
  patientName,
  items = [],
  onClose,
  onSubmit,
}) {

  const [receta, setReceta] = useState(EMPTY_RECETA);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setReceta(EMPTY_RECETA);
    setNotes("");
  }, [open]);

  const set = (field) => (event) => {
    const value = event.target.value;
    setReceta((prev) => ({ ...prev, [field]: value }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await onSubmit({ receta, notes });
      onClose();
    } finally {
      setSaving(false);
    }
  };


  return (
    <Modal isOpen={open} onClose={onClose} title="Generar orden de laboratorio" size="lg">

      <form onSubmit={handleSubmit} className="space-y-4">

        <p className="text-sm text-text-secondary">
          Esta venta incluye {items.map((item) => item.model || item.code).join(", ")}
          {patientName ? ` para ${patientName}` : ""}. Captura la graduación para generar la orden de laboratorio.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <p className="col-span-3 -mb-2 text-sm font-semibold text-text-primary">Ojo derecho (OD)</p>
          <Input label="Esfera" value={receta.odEsfera} onChange={set("odEsfera")} />
          <Input label="Cilindro" value={receta.odCilindro} onChange={set("odCilindro")} />
          <Input label="Eje" value={receta.odEje} onChange={set("odEje")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <p className="col-span-3 -mb-2 text-sm font-semibold text-text-primary">Ojo izquierdo (OI)</p>
          <Input label="Esfera" value={receta.oiEsfera} onChange={set("oiEsfera")} />
          <Input label="Cilindro" value={receta.oiCilindro} onChange={set("oiCilindro")} />
          <Input label="Eje" value={receta.oiEje} onChange={set("oiEje")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Adición" value={receta.adicion} onChange={set("adicion")} />
          <Input label="Distancia pupilar (DP)" value={receta.dp} onChange={set("dp")} />
        </div>

        <div className="w-full">
          <label htmlFor="receta-notes" className="mb-2 block text-sm font-medium text-text-primary">
            Observaciones
          </label>
          <textarea
            id="receta-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Omitir
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Generar orden"}
          </Button>
        </div>

      </form>
    </Modal>
  );
}
