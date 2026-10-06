import { useEffect, useState } from "react";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { CURRENCIES, TAX_REGIMES, DEFAULT_TAX_OPTIONS } from "../constants";


const taxLabel = (value) => DEFAULT_TAX_OPTIONS.find((t) => t.value === String(value))?.label ?? `${value}%`;
const currencyLabel = (value) => CURRENCIES.find((c) => c.value === value)?.label ?? value;
const regimeLabel = (value) => TAX_REGIMES.find((r) => r.value === value)?.label ?? value;


export default function ConfiguracionComercialTab({ info, canManage, onSave }) {

  const [form, setForm] = useState(info);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(info), [info]);

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-surface p-6">
        <p className="mb-4 text-sm text-text-secondary">Parámetros fiscales y comerciales para la operación.</p>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Moneda" value={currencyLabel(info.moneda)} />
          <Field label="Régimen fiscal" value={regimeLabel(info.regimenFiscal)} />
          <Field label="Impuesto predeterminado" value={taxLabel(info.impuestoPredeterminado)} />
          <Field label="Folio inicial de ventas" value={info.folioInicialVentas} />
          <Field label="Serie de documentos" value={info.serieDocumentos} />
          <Field label="Texto de documentos" value={info.textoDocumentos} />
        </dl>
      </div>
    );
  }

  const set = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!form.moneda) nextErrors.moneda = "Selecciona una moneda.";
    if (!form.regimenFiscal) nextErrors.regimenFiscal = "Selecciona un régimen fiscal.";
    if (!form.impuestoPredeterminado) nextErrors.impuestoPredeterminado = "Selecciona un impuesto.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-surface p-6">

      <p className="mb-4 text-sm text-text-secondary">Parámetros fiscales y comerciales para la operación.</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="w-full">
          <label htmlFor="com-moneda" className="mb-2 block text-sm font-medium text-text-primary">Moneda *</label>
          <select id="com-moneda" value={form.moneda ?? ""} onChange={set("moneda")} className={selectClass}>
            {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div className="w-full">
          <label htmlFor="com-regimen" className="mb-2 block text-sm font-medium text-text-primary">Régimen fiscal *</label>
          <select id="com-regimen" value={form.regimenFiscal ?? ""} onChange={set("regimenFiscal")} className={selectClass}>
            <option value="">Selecciona...</option>
            {TAX_REGIMES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          {errors.regimenFiscal && <p className="mt-1.5 text-sm text-error">{errors.regimenFiscal}</p>}
        </div>

        <div className="w-full">
          <label htmlFor="com-impuesto" className="mb-2 block text-sm font-medium text-text-primary">Impuesto predeterminado *</label>
          <select id="com-impuesto" value={form.impuestoPredeterminado ?? ""} onChange={set("impuestoPredeterminado")} className={selectClass}>
            {DEFAULT_TAX_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Input label="Folio inicial de ventas" value={form.folioInicialVentas ?? ""} onChange={set("folioInicialVentas")} />
        <Input label="Serie de documentos" value={form.serieDocumentos ?? ""} onChange={set("serieDocumentos")} />
      </div>

      <div className="mt-4 w-full">
        <label htmlFor="com-texto" className="mb-2 block text-sm font-medium text-text-primary">Texto de documentos</label>
        <textarea
          id="com-texto"
          value={form.textoDocumentos ?? ""}
          onChange={set("textoDocumentos")}
          rows={2}
          className={`${selectClass} resize-none`}
        />
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
        <Button type="button" variant="outline" onClick={() => setForm(info)}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
      </div>

    </form>
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


const selectClass = `
  w-full
  rounded-xl
  border
  border-gray-200
  bg-surface
  px-4
  py-3
  text-text-primary
  outline-none
  transition
  focus:border-indigo-primary
  focus:ring-2
  focus:ring-indigo-light
`;
