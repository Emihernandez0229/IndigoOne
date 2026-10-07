import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { X } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import Button from "../../shared/components/Button";
import useBranchScope from "../../shared/hooks/useBranchScope";
import { ROLES } from "../../shared/security/roles";

import { listBranches } from "../branches/services/branchService";
import { listInventory } from "../inventory/services/inventoryService";
import usePatients from "../pacientes/hooks/usePatients";
import useLaboratorio from "../laboratorio/hooks/useLaboratorio";
import RecetaFormModal from "../laboratorio/components/RecetaFormModal";
import useVentas from "./hooks/useVentas";
import PaymentModal from "./components/PaymentModal";
import { IVA_RATE } from "./constants";


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


export default function NuevaVentaPage() {

  const navigate = useNavigate();

  const { isOwner, branches, selectedBranch, setSelectedBranch } = useBranchScope({
    listBranches,
    ownerRoles: [ROLES.OPTICA_DUENO],
    alwaysLoad: true,
  });

  const branchName = branches.find((b) => b.id === selectedBranch)?.name ?? "";

  const { patients } = usePatients(selectedBranch);
  const { create } = useVentas(selectedBranch);
  const { create: createLabOrder } = useLaboratorio(selectedBranch);

  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!selectedBranch) {
      setProducts([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const data = await listInventory();
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setProducts(
          list.filter(
            (item) => item.branchId === selectedBranch && item.active && item.stockAvailable > 0
          )
        );
      } catch (error) {
        console.error("Error al cargar inventario:", error);
        if (active) setProducts([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedBranch]);

  // Paciente
  const [patientQuery, setPatientQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const patientMatches = useMemo(() => {
    const term = patientQuery.trim().toLowerCase();
    if (!term) return [];
    return patients
      .filter((p) => p.name.toLowerCase().includes(term) || (p.phone ?? "").includes(term))
      .slice(0, 6);
  }, [patients, patientQuery]);

  // Productos / carrito
  const [productQuery, setProductQuery] = useState("");
  const [cart, setCart] = useState([]);
  const productSearchRef = useRef(null);

  const availableFor = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.stockAvailable : 0;
  };

  const productMatches = useMemo(() => {
    const term = productQuery.trim().toLowerCase();
    if (!term) return [];
    return products
      .filter((p) => p.code.toLowerCase().includes(term) || p.model.toLowerCase().includes(term))
      .slice(0, 6);
  }, [products, productQuery]);

  const addProduct = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockAvailable) return prev;
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          code: product.code,
          model: product.model,
          description: product.description,
          type: product.type,
          quantity: 1,
          unitPrice: product.cost,
        },
      ];
    });
    setProductQuery("");
  };

  const updateQuantity = (productId, quantity) => {
    const max = availableFor(productId);
    const safe = Math.max(1, Math.min(Number(quantity) || 1, max));
    setCart((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity: safe } : item))
    );
  };

  const updatePrice = (productId, price) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, unitPrice: Number(price) || 0 } : item
      )
    );
  };

  const removeItem = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };


  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const iva = subtotal * IVA_RATE;
  const total = subtotal + iva;

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [labPrompt, setLabPrompt] = useState(null);

  const missingReason = !selectedPatient
    ? "Selecciona un paciente"
    : cart.length === 0
    ? "Agrega al menos un producto"
    : null;


  const handleConfirmPayment = async ({ paymentMethod, montoPagado, saldoPendiente }) => {
    const created = await create({
      branchId: selectedBranch,
      patientId: selectedPatient.id,
      paymentMethod,
      items: cart,
      subtotal,
      iva,
      total,
      montoPagado,
      saldoPendiente,
    });

    const micaItems = cart.filter((item) => item.type === "micas");

    if (micaItems.length > 0) {
      setLabPrompt({ saleId: created.id, patientId: selectedPatient.id, items: micaItems });
    } else {
      navigate("/opticas/ventas");
    }
  };

  const handleCreateLabOrder = async ({ receta, notes }) => {
    await createLabOrder({
      branchId: selectedBranch,
      patientId: labPrompt.patientId,
      saleId: labPrompt.saleId,
      items: labPrompt.items,
      receta,
      notes,
    });
    navigate("/opticas/ventas");
  };


  return (

    <PageContainer
      title="Nueva venta"
      description={
        <span className="flex flex-wrap items-center gap-2">
          {formatFullDate(new Date())}
          {isOwner ? (
            <>
              <span>·</span>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="rounded-lg border border-gray-200 bg-surface px-2 py-1 text-sm text-text-primary outline-none focus:border-indigo-primary"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </>
          ) : (
            branchName && <span>· {branchName}</span>
          )}
        </span>
      }
    >

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          {/* PACIENTE */}
          <div className="rounded-2xl border border-gray-200 bg-surface p-6">
            <h2 className="mb-4 font-semibold text-text-primary">Paciente</h2>

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
                  onChange={(e) => setPatientQuery(e.target.value)}
                  placeholder="Buscar por nombre o teléfono..."
                  disabled={!selectedBranch}
                  className="w-full rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light disabled:opacity-50"
                />
                {patientMatches.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-lg">
                    {patientMatches.map((patient) => (
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
          </div>

          {/* PRODUCTOS */}
          <div className="rounded-2xl border border-gray-200 bg-surface p-6">
            <h2 className="mb-4 font-semibold text-text-primary">Productos</h2>

            <div className="relative">
              <input
                ref={productSearchRef}
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Buscar por código o modelo..."
                disabled={!selectedBranch}
                className="w-full rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light disabled:opacity-50"
              />
              {productMatches.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-lg">
                  {productMatches.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProduct(product)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-background"
                    >
                      <span className="text-text-primary">{product.model} ({product.code})</span>
                      <span className="text-text-secondary">{product.stockAvailable} disp.</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-background">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    <th className="px-4 py-2">Código</th>
                    <th className="px-4 py-2">Producto</th>
                    <th className="px-4 py-2">Descripción</th>
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
                        Busca y agrega productos arriba para comenzar.
                      </td>
                    </tr>
                  ) : (
                    cart.map((item) => (
                      <tr key={item.productId}>
                        <td className="px-4 py-2 text-text-secondary">{item.code}</td>
                        <td className="px-4 py-2 font-medium text-text-primary">{item.model}</td>
                        <td className="px-4 py-2 text-text-secondary">{item.description || "—"}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="1"
                            max={availableFor(item.productId)}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.productId, e.target.value)}
                            className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-text-primary outline-none focus:border-indigo-primary"
                          />
                        </td>
                        <td className="px-4 py-2 text-text-secondary">{availableFor(item.productId)}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updatePrice(item.productId, e.target.value)}
                            className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-text-primary outline-none focus:border-indigo-primary"
                          />
                        </td>
                        <td className="px-4 py-2 font-medium text-text-primary">
                          {currency(item.quantity * item.unitPrice)}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="text-text-secondary hover:text-error"
                            aria-label="Quitar producto"
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

            <button
              type="button"
              onClick={() => productSearchRef.current?.focus()}
              className="mt-3 text-sm font-medium text-indigo-primary hover:underline"
            >
              + Agregar producto
            </button>
          </div>

        </div>

        {/* RESUMEN */}
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
              disabled={Boolean(missingReason)}
              onClick={() => setPaymentOpen(true)}
            >
              Continuar al pago →
            </Button>

            {missingReason && (
              <p className="mt-2 text-center text-xs text-text-secondary">{missingReason}</p>
            )}
          </div>
        </div>

      </div>

      <PaymentModal
        open={paymentOpen}
        total={total}
        onClose={() => setPaymentOpen(false)}
        onConfirm={handleConfirmPayment}
      />

      <RecetaFormModal
        open={Boolean(labPrompt)}
        patientName={selectedPatient?.name}
        items={labPrompt?.items ?? []}
        onClose={() => {
          setLabPrompt(null);
          navigate("/opticas/ventas");
        }}
        onSubmit={handleCreateLabOrder}
      />

    </PageContainer>

  );

}
