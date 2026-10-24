import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { ArrowLeft, X, CircleCheck, Wrench, FlaskConical } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import Button from "../../shared/components/Button";
import SelectFilter from "../../shared/filters/SelectFilter";
import useBranchScope from "../../shared/hooks/useBranchScope";
import { useAuth } from "../../shared/context/AuthContext";
import { ROLES } from "../../shared/security/roles";

import { listBranches } from "../branches/services/branchService";
import { textWithSpecialChars } from "../../shared/utils/textInput";
import usePatients from "../pacientes/hooks/usePatients";
import useProductos from "../catalogo/hooks/useProductos";
import useServicios from "../catalogo/hooks/useServicios";
import useLaboratorio from "../laboratorio/hooks/useLaboratorio";
import { EMPTY_RECETA } from "../laboratorio/constants";
import useVentas from "./hooks/useVentas";
import VentaStepper from "./components/VentaStepper";
import GraduacionFields from "./components/GraduacionFields";
import VentaPageDecoration from "./components/VentaPageDecoration";
import { downloadVentaReceipt } from "./pdfReceipt";
import {
  IVA_RATE, WORK_TYPES, WORK_TYPE_INFO, INTERNAL_WORK_SUBTYPES,
  LAB_WORK_SUBTYPES, PRIORITIES, PAYMENT_METHODS,
} from "./constants";


const INDICACIONES_MAX = 300;

// Busqueda de paciente: por nombre (letras, hasta 50) o telefono (solo
// digitos, hasta 10) - se detecta segun lo que ya se escribio.
function onlyPatientSearch(value) {
  const clean = value.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿÑñ0-9\s]/g, "");
  const isNumeric = /^\d+$/.test(clean.trim());
  return isNumeric ? clean.slice(0, 10) : clean.slice(0, 50);
}


const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatFullDate = (date) => {
  const text = date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const WORK_TYPE_ICONS = {
  venta_directa: CircleCheck,
  trabajo_interno: Wrench,
  orden_laboratorio: FlaskConical,
};


function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-surface p-6">
      {title && <h2 className="mb-4 font-semibold text-text-primary">{title}</h2>}
      {children}
    </div>
  );
}


function WorkTypeCard({ value, selected, onSelect }) {
  const info = WORK_TYPE_INFO[value];
  const Icon = WORK_TYPE_ICONS[value];
  const isLab = value === "orden_laboratorio";

  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
        selected
          ? isLab
            ? "border-purple-400 bg-purple-50"
            : "border-indigo-primary bg-indigo-light/40"
          : "border-gray-200 hover:border-indigo-primary"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          selected ? (isLab ? "bg-purple-600 text-white" : "bg-indigo-primary text-white") : "bg-background text-text-secondary"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1">
        <p className="font-semibold text-text-primary">{info.label}</p>
        <p className="text-sm text-text-secondary">{info.description}</p>
      </div>
      {selected && <CircleCheck className={`h-5 w-5 shrink-0 ${isLab ? "text-purple-600" : "text-indigo-primary"}`} />}
    </button>
  );
}


function SubtypeRadioList({ options, value, onChange }) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
            value === option.value ? "border-indigo-primary bg-indigo-light/30" : "border-gray-200 hover:border-indigo-primary"
          }`}
        >
          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
            value === option.value ? "border-indigo-primary" : "border-gray-300"
          }`}>
            {value === option.value && <span className="h-2 w-2 rounded-full bg-indigo-primary" />}
          </span>
          <span className="font-medium text-text-primary">{option.label}</span>
        </button>
      ))}
    </div>
  );
}


export default function NuevaVentaPage() {

  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();

  const { isOwner, branches, selectedBranch, setSelectedBranch } = useBranchScope({
    listBranches,
    ownerRoles: [ROLES.OPTICA_DUENO],
    alwaysLoad: true,
  });

  // Si se vino de la lista de Ventas con una sucursal ya elegida, se usa
  // como punto de partida - el dueno la puede cambiar desde aqui mismo.
  const incomingBranchId = location.state?.branchId;
  useEffect(() => {
    if (incomingBranchId) setSelectedBranch(incomingBranchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingBranchId]);

  const branchName = branches.find((b) => b.id === selectedBranch)?.name ?? "";

  // "Sin sucursal" (selectedBranch === "") no bloquea la busqueda: solo
  // cambia el alcance (todos los pacientes, productos sin tope de stock).
  const { patients } = usePatients(selectedBranch, { scopeToAll: !selectedBranch });
  const { productos } = useProductos();
  const { servicios } = useServicios();
  const { create } = useVentas(selectedBranch);
  const { create: createLabOrder } = useLaboratorio(selectedBranch);

  const [step, setStep] = useState(1);

  // Paciente
  const [patientQuery, setPatientQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Catalogo: productos y servicios juntos, con existencia por sucursal
  // solo para productos (los servicios no tienen stock). Sin sucursal
  // elegida no hay stock que validar, se muestran sin tope.
  const catalogItems = useMemo(() => {
    const prodItems = (productos ?? [])
      .filter((p) => p.active)
      .map((p) => ({
        itemId: p.id,
        itemType: "producto",
        code: p.code,
        name: p.name,
        unitPrice: p.salePrice,
        stockAvailable: selectedBranch
          ? p.stockPorSucursal?.find((s) => s.branchId === selectedBranch)?.stock ?? 0
          : null,
      }))
      .filter((p) => !selectedBranch || p.stockAvailable > 0);

    const servItems = (servicios ?? [])
      .filter((s) => s.active)
      .map((s) => ({
        itemId: s.id,
        itemType: "servicio",
        code: s.code,
        name: s.name,
        unitPrice: s.price,
        stockAvailable: null,
      }));

    return [...prodItems, ...servItems];
  }, [productos, servicios, selectedBranch]);

  const [itemQuery, setItemQuery] = useState("");
  const [cart, setCart] = useState([]);

  // Al cambiar de sucursal, la existencia de productos ya no aplica.
  const handleBranchChange = (branchId) => {
    setSelectedBranch(branchId);
    setCart([]);
  };

  // null = sin tope (servicios, o productos cuando no hay sucursal elegida).
  const availableFor = (itemId, itemType) => {
    if (itemType === "servicio") return null;
    return catalogItems.find((i) => i.itemId === itemId && i.itemType === itemType)?.stockAvailable ?? null;
  };

  const itemMatches = useMemo(() => {
    const term = itemQuery.trim().toLowerCase();
    if (!term) return [];
    return catalogItems
      .filter((i) => i.code.toLowerCase().includes(term) || i.name.toLowerCase().includes(term))
      .slice(0, 6);
  }, [catalogItems, itemQuery]);

  const addItem = (item) => {
    setCart((prev) => {
      const existing = prev.find((row) => row.itemId === item.itemId && row.itemType === item.itemType);
      if (existing) {
        if (item.itemType === "producto" && item.stockAvailable != null && existing.quantity >= item.stockAvailable) return prev;
        return prev.map((row) =>
          row.itemId === item.itemId && row.itemType === item.itemType ? { ...row, quantity: row.quantity + 1 } : row
        );
      }
      return [
        ...prev,
        {
          itemId: item.itemId,
          itemType: item.itemType,
          code: item.code,
          model: item.name,
          quantity: 1,
          unitPrice: item.unitPrice,
        },
      ];
    });
    setItemQuery("");
  };

  const updateQuantity = (itemId, itemType, quantity) => {
    const max = itemType === "producto" ? (availableFor(itemId, itemType) ?? 999) : 999;
    const safe = Math.max(1, Math.min(Number(quantity) || 1, max));
    setCart((prev) =>
      prev.map((row) => (row.itemId === itemId && row.itemType === itemType ? { ...row, quantity: safe } : row))
    );
  };

  const updatePrice = (itemId, itemType, price) => {
    setCart((prev) =>
      prev.map((row) =>
        row.itemId === itemId && row.itemType === itemType ? { ...row, unitPrice: Number(price) || 0 } : row
      )
    );
  };

  const removeItem = (itemId, itemType) => {
    setCart((prev) => prev.filter((row) => !(row.itemId === itemId && row.itemType === itemType)));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const iva = subtotal * IVA_RATE;
  const total = subtotal + iva;

  // Trabajo (paso 2) - "Venta directa" no necesita columna de detalle, se
  // queda centrado; trabajo interno/orden de laboratorio sí la usan y
  // pasan al layout de 2 columnas.
  const [workType, setWorkType] = useState("venta_directa");
  const [workSubtype, setWorkSubtype] = useState("");
  const [priority, setPriority] = useState("normal");
  const [indicaciones, setIndicaciones] = useState("");
  const [receta, setReceta] = useState(EMPTY_RECETA);

  const handleWorkTypeChange = (value) => {
    setWorkType(value);
    setWorkSubtype("");
  };

  const handleRecetaChange = (field, value) => {
    setReceta((prev) => ({ ...prev, [field]: value }));
  };

  // Pago (paso 3) - solo efectivo, total o parcial.
  const [paymentMode, setPaymentMode] = useState("full");
  const [partialAmount, setPartialAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const montoPagado = paymentMode === "full" ? total : Number(partialAmount) || 0;
  const saldoPendiente = Math.max(0, total - montoPagado);


  // "Sin sucursal" es una eleccion valida (ver handleBranchChange), no
  // bloquea el paso 1 - solo paciente y carrito son obligatorios.
  const step1MissingReason = !selectedPatient
    ? "Selecciona un paciente"
    : cart.length === 0
    ? "Agrega al menos un producto o servicio"
    : null;

  const step2MissingReason =
    workType === "trabajo_interno" && !workSubtype
      ? "Selecciona el tipo de trabajo interno"
      : workType === "orden_laboratorio" && !workSubtype
      ? "Selecciona el tipo de trabajo solicitado al laboratorio"
      : null;


  const handleConfirmVenta = async () => {
    try {
      setSaving(true);

      const created = await create({
        branchId: selectedBranch,
        patientId: selectedPatient.id,
        createdBy: currentUser?.id,
        workType,
        priority,
        paymentMethod: "efectivo",
        items: cart,
        subtotal,
        iva,
        total,
        montoPagado: paymentMode === "full" ? total : montoPagado,
        saldoPendiente: paymentMode === "full" ? 0 : saldoPendiente,
      });

      if (workType === "orden_laboratorio") {
        await createLabOrder({
          branchId: selectedBranch,
          patientId: selectedPatient.id,
          saleId: created.id,
          createdBy: currentUser?.id,
          workSubtype,
          items: cart,
          receta,
          notes: indicaciones,
        });
      }

      downloadVentaReceipt({
        folio: created.folio,
        date: formatFullDate(new Date()),
        branchName,
        patientName: selectedPatient.name,
        sellerName: currentUser?.name,
        workTypeLabel: WORK_TYPE_INFO[workType]?.label,
        workSubtypeLabel:
          workType === "trabajo_interno"
            ? INTERNAL_WORK_SUBTYPES.find((o) => o.value === workSubtype)?.label
            : workType === "orden_laboratorio"
            ? LAB_WORK_SUBTYPES.find((o) => o.value === workSubtype)?.label
            : "",
        items: cart,
        subtotal,
        iva,
        total,
        paymentMethodLabel: PAYMENT_METHODS.find((m) => m.value === "efectivo")?.label,
        montoPagado: paymentMode === "full" ? total : montoPagado,
        saldoPendiente: paymentMode === "full" ? 0 : saldoPendiente,
      });

      navigate(workType === "orden_laboratorio" ? "/opticas/laboratorio" : "/opticas/ventas");
    } finally {
      setSaving(false);
    }
  };


  return (

    <PageContainer
      title="Nueva venta"
      description={
        <span className="flex flex-wrap items-center gap-2">
          {formatFullDate(new Date())}
          {branchName && <span>· {branchName}</span>}
        </span>
      }
      actions={
        <Button
          variant="outline"
          className="inline-flex items-center gap-2 py-2.5 text-sm"
          onClick={() => navigate("/opticas/ventas")}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      }
    >

      <div className="relative overflow-hidden rounded-2xl">

      <VentaPageDecoration />

      <div className="relative space-y-6 p-1">

        <div className="mx-auto max-w-2xl">
          <VentaStepper step={step} />
        </div>

        {step === 1 && (
          <div className="grid gap-6 lg:grid-cols-3">

          <div className="space-y-6 lg:col-span-2">

            {isOwner && (
              <Card title="Sucursal">
                <SelectFilter
                  value={selectedBranch}
                  onChange={handleBranchChange}
                  options={[{ value: "", label: "Sin sucursal" }, ...branches.map((b) => ({ value: b.id, label: b.name }))]}
                />
              </Card>
            )}

            <Card title="Paciente">
              {selectedPatient ? (
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-background px-4 py-3">
                  <div>
                    <p className="font-medium text-text-primary">{selectedPatient.name}</p>
                    <p className="text-sm text-text-secondary">{selectedPatient.phone || "—"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(null)}
                    className="text-text-secondary hover:text-error"
                    aria-label="Quitar paciente"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(onlyPatientSearch(e.target.value))}
                    placeholder="Buscar por nombre o teléfono..."
                    className="w-full rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light disabled:opacity-50"
                  />
                  {patientQuery.trim() && (
                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-lg">
                      {patients
                        .filter((p) => p.name.toLowerCase().includes(patientQuery.trim().toLowerCase()) || (p.phone ?? "").includes(patientQuery.trim()))
                        .slice(0, 6)
                        .map((patient) => (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setPatientQuery("");
                            }}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-background"
                          >
                            <span className="text-text-primary">{patient.name}</span>
                            <span className="text-text-secondary">{patient.phone}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

            <Card title="Productos y servicios">
              <div className="relative">
                <input
                  value={itemQuery}
                  onChange={(e) => setItemQuery(e.target.value)}
                  placeholder="Buscar por código o nombre..."
                  className="w-full rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light disabled:opacity-50"
                />
                {itemMatches.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-lg">
                    {itemMatches.map((item) => (
                      <button
                        key={`${item.itemType}-${item.itemId}`}
                        type="button"
                        onClick={() => addItem(item)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-background"
                      >
                        <span className="text-text-primary">
                          {item.name} ({item.code})
                          <span className="ml-2 rounded-full bg-indigo-light px-2 py-0.5 text-xs font-medium text-indigo-primary">
                            {item.itemType === "producto" ? "Producto" : "Servicio"}
                          </span>
                        </span>
                        <span className="text-text-secondary">
                          {item.itemType === "producto" && item.stockAvailable != null ? `${item.stockAvailable} disp.` : "Sin límite"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-background">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      <th className="px-4 py-2">Tipo</th>
                      <th className="px-4 py-2">Código</th>
                      <th className="px-4 py-2">Nombre</th>
                      <th className="px-4 py-2">Cant.</th>
                      <th className="px-4 py-2">Exist.</th>
                      <th className="px-4 py-2">Precio unit.</th>
                      <th className="px-4 py-2">Subtotal</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cart.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-text-secondary">
                          Busca y agrega productos o servicios arriba para comenzar.
                        </td>
                      </tr>
                    ) : (
                      cart.map((item) => (
                        <tr key={`${item.itemType}-${item.itemId}`}>
                          <td className="px-4 py-2 text-text-secondary">{item.itemType === "producto" ? "Producto" : "Servicio"}</td>
                          <td className="px-4 py-2 text-text-secondary">{item.code}</td>
                          <td className="px-4 py-2 font-medium text-text-primary">{item.model}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="1"
                              max={item.itemType === "producto" ? availableFor(item.itemId, item.itemType) : undefined}
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.itemId, item.itemType, e.target.value)}
                              className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-text-primary outline-none focus:border-indigo-primary"
                            />
                          </td>
                          <td className="px-4 py-2 text-text-secondary">
                            {item.itemType === "producto" ? (availableFor(item.itemId, item.itemType) ?? "Sin límite") : "—"}
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updatePrice(item.itemId, item.itemType, e.target.value)}
                              className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-text-primary outline-none focus:border-indigo-primary"
                            />
                          </td>
                          <td className="px-4 py-2 font-medium text-text-primary">
                            {currency(item.quantity * item.unitPrice)}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => removeItem(item.itemId, item.itemType)}
                              className="text-text-secondary hover:text-error"
                              aria-label="Quitar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-2xl border border-gray-200 bg-surface p-6">
              <h2 className="mb-4 font-semibold text-text-primary">Resumen de venta</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span>{currency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>IVA (16%)</span>
                  <span>{currency(iva)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-text-primary">
                  <span>Total</span>
                  <span>{currency(total)}</span>
                </div>
              </div>

              <Button
                className="mt-6 w-full justify-center"
                disabled={Boolean(step1MissingReason)}
                onClick={() => setStep(2)}
              >
                Continuar a tipo de trabajo →
              </Button>

              {step1MissingReason && (
                <p className="mt-2 text-center text-xs text-text-secondary">{step1MissingReason}</p>
              )}
            </div>
          </div>

          </div>
        )}

        {step === 2 && workType === "venta_directa" && (
          <div className="mx-auto max-w-2xl space-y-6">

            <Card title="Prioridad">
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriority(option.value)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      priority === option.value
                        ? "bg-indigo-primary text-white"
                        : "border border-gray-200 text-text-secondary hover:border-indigo-primary"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="mb-1 font-semibold text-text-primary">¿Qué necesita esta venta?</h2>
              <p className="mb-4 text-sm text-text-secondary">
                Selecciona los procesos que se deben realizar después de registrar la venta.
              </p>

              <div className="space-y-3">
                {WORK_TYPES.map((option) => (
                  <WorkTypeCard
                    key={option.value}
                    value={option.value}
                    selected={workType === option.value}
                    onSelect={handleWorkTypeChange}
                  />
                ))}
              </div>
            </Card>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Volver</Button>
              <Button onClick={() => setStep(3)}>
                Revisar resumen →
              </Button>
            </div>

          </div>
        )}

        {step === 2 && workType !== "venta_directa" && (
          <div className="grid gap-6 lg:grid-cols-3">

          <div className="space-y-6 lg:col-span-1">

            <Card title="Prioridad">
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriority(option.value)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      priority === option.value
                        ? "bg-indigo-primary text-white"
                        : "border border-gray-200 text-text-secondary hover:border-indigo-primary"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="mb-1 font-semibold text-text-primary">¿Qué necesita esta venta?</h2>
              <p className="mb-4 text-sm text-text-secondary">
                Selecciona los procesos que se deben realizar después de registrar la venta.
              </p>

              <div className="space-y-3">
                {WORK_TYPES.map((option) => (
                  <WorkTypeCard
                    key={option.value}
                    value={option.value}
                    selected={workType === option.value}
                    onSelect={handleWorkTypeChange}
                  />
                ))}
              </div>
            </Card>

          </div>

          <div className="space-y-6 lg:col-span-2">

            {workType === "trabajo_interno" && (
              <Card title="Tipo de trabajo interno">
                <SubtypeRadioList options={INTERNAL_WORK_SUBTYPES} value={workSubtype} onChange={setWorkSubtype} />
              </Card>
            )}

            {workType === "orden_laboratorio" && (
              <>
                <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5">
                  <div className="mb-1 flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-purple-600" />
                    <p className="font-semibold text-text-primary">Orden de laboratorio</p>
                  </div>
                  <p className="mb-4 text-sm text-text-secondary">
                    Solicitud para Índigo · no es un producto vendido por sí misma.
                  </p>

                  <p className="mb-2 text-sm font-medium text-text-primary">Tipo de trabajo solicitado</p>
                  <SubtypeRadioList options={LAB_WORK_SUBTYPES} value={workSubtype} onChange={setWorkSubtype} />

                  <div className="mt-4">
                    <label htmlFor="indicaciones" className="mb-2 block text-sm font-medium text-text-primary">
                      Indicaciones para laboratorio
                    </label>
                    <textarea
                      id="indicaciones"
                      value={indicaciones}
                      onChange={(e) => setIndicaciones(textWithSpecialChars(e.target.value, INDICACIONES_MAX))}
                      rows={3}
                      maxLength={INDICACIONES_MAX}
                      placeholder="Graduación, material, tratamiento, medidas y otras indicaciones..."
                      className="w-full resize-none rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light"
                    />
                    <p className="mt-1 text-right text-xs text-text-secondary">{indicaciones.length}/{INDICACIONES_MAX}</p>
                  </div>
                </div>

                <Card>
                  <GraduacionFields receta={receta} onChange={handleRecetaChange} />
                </Card>
              </>
            )}

          </div>

          <div className="flex items-center justify-end gap-2 lg:col-span-3">
            {step2MissingReason && (
              <p className="text-sm text-text-secondary">{step2MissingReason}</p>
            )}
            <Button variant="outline" onClick={() => setStep(1)}>Volver</Button>
            <Button disabled={Boolean(step2MissingReason)} onClick={() => setStep(3)}>
              Revisar resumen →
            </Button>
          </div>

          </div>
        )}

        {step === 3 && (
          <div className="grid gap-6 lg:grid-cols-3">

          <div className="space-y-6 lg:col-span-2">

            <Card title="Cliente">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Nombre</dt>
                  <dd className="mt-1 text-sm font-bold text-text-primary">{selectedPatient?.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Teléfono</dt>
                  <dd className="mt-1 text-sm font-bold text-text-primary">{selectedPatient?.phone || "—"}</dd>
                </div>
              </dl>
            </Card>

            <Card title="Trabajo">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Tipo</dt>
                  <dd className="mt-1 text-sm font-bold text-text-primary">{WORK_TYPE_INFO[workType]?.label}</dd>
                </div>
                {workSubtype && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Detalle</dt>
                    <dd className="mt-1 text-sm font-bold text-text-primary">
                      {(workType === "trabajo_interno" ? INTERNAL_WORK_SUBTYPES : LAB_WORK_SUBTYPES).find((o) => o.value === workSubtype)?.label}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Prioridad</dt>
                  <dd className="mt-1 text-sm font-bold text-text-primary">{PRIORITIES.find((p) => p.value === priority)?.label}</dd>
                </div>
              </dl>
              {indicaciones && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="mb-1 text-sm font-medium text-text-secondary">Indicaciones para laboratorio</p>
                  <p className="text-sm text-text-primary">{indicaciones}</p>
                </div>
              )}
            </Card>

            <Card title="Artículo">
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={`${item.itemType}-${item.itemId}`} className="flex items-center justify-between rounded-xl bg-background px-4 py-3">
                    <div>
                      <p className="font-medium text-text-primary">{item.model}</p>
                      <p className="text-xs text-text-secondary">{item.code} · Cant. {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-text-primary">{currency(item.quantity * item.unitPrice)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1 border-t border-gray-100 pt-4 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span>{currency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>IVA (16%)</span>
                  <span>{currency(iva)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-1 text-base font-bold text-text-primary">
                  <span>Total</span>
                  <span>{currency(total)}</span>
                </div>
              </div>
            </Card>

          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4 rounded-2xl border border-gray-200 bg-surface p-6">
              <h2 className="font-semibold text-text-primary">Método de pago</h2>

              <div className="grid grid-cols-2 gap-2 rounded-xl bg-background p-1">
                <button
                  type="button"
                  onClick={() => setPaymentMode("full")}
                  className={`rounded-lg py-2 text-sm font-medium transition ${
                    paymentMode === "full" ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary"
                  }`}
                >
                  Pago total
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("partial")}
                  className={`rounded-lg py-2 text-sm font-medium transition ${
                    paymentMode === "partial" ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary"
                  }`}
                >
                  Pago parcial
                </button>
              </div>

              <p className="text-sm font-medium text-text-primary">Efectivo</p>

              {paymentMode === "partial" && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="partial-amount" className="mb-2 block text-sm font-medium text-text-primary">
                      Monto a pagar
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                      <input
                        id="partial-amount"
                        type="number"
                        min="0"
                        max={total}
                        step="0.01"
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(e.target.value)}
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

              <div className="space-y-2 pt-2">
                <Button
                  className="w-full justify-center bg-success hover:opacity-90"
                  disabled={saving || (paymentMode === "partial" && montoPagado <= 0)}
                  onClick={handleConfirmVenta}
                >
                  {saving ? "Guardando..." : "Confirmar venta"}
                </Button>
                <Button variant="outline" className="w-full justify-center" onClick={() => setStep(2)}>
                  Volver
                </Button>
              </div>
            </div>
          </div>

          </div>
        )}

      </div>

      </div>

    </PageContainer>

  );

}
