import jsPDF from "jspdf";

import logoIndigo from "../../assets/indigologo.png";
import { WORK_TYPE_INFO, INTERNAL_WORK_SUBTYPES, PAYMENT_METHODS } from "./constants";


const money = (value) => `$${Number(value ?? 0).toFixed(2)}`;

const paymentLabel = (value) =>
  PAYMENT_METHODS.find((option) => option.value === value)?.label ?? value;

const formatFullDate = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" });
};

const truncate = (text, max) =>
  !text ? "" : text.length > max ? `${text.slice(0, max - 1)}…` : text;

// Paleta de marca (ver frontend/src/styles/theme.css) en RGB para jsPDF.
const COLOR = {
  primary: [41, 52, 122],      // --color-indigo-primary
  dark: [23, 32, 79],          // --color-indigo-dark
  light: [233, 237, 255],      // --color-indigo-light
  background: [246, 247, 251], // --color-background
  textPrimary: [24, 32, 51],   // --color-text-primary
  textSecondary: [102, 112, 133], // --color-text-secondary
  success: [34, 160, 107],     // --color-success
  white: [255, 255, 255],
};

const MARGIN = 14;
const PAGE_WIDTH = 210;
const RIGHT = PAGE_WIDTH - MARGIN;
const CONTENT_WIDTH = RIGHT - MARGIN;

/**
 * Reconstruye los datos que necesita downloadVentaReceipt a partir de una
 * venta ya guardada (viene con los ids/códigos "crudos", no las etiquetas)
 * - para poder reimprimir el ticket desde Ventas, no solo al momento de
 * crearla.
 */
export function buildReceiptData(venta) {
  return {
    folio: venta.folio,
    date: formatFullDate(venta.createdAt),
    branchName: venta.branchName,
    patientName: venta.patientName || "Público general",
    sellerName: venta.sellerName,
    workTypeLabel: WORK_TYPE_INFO[venta.workType]?.label ?? venta.workType,
    workSubtypeLabel: INTERNAL_WORK_SUBTYPES.find((o) => o.value === venta.workSubtype)?.label ?? "",
    items: venta.items,
    subtotal: venta.subtotal,
    iva: venta.iva,
    total: venta.total,
    paymentMethodLabel: paymentLabel(venta.paymentMethod),
    montoPagado: venta.montoPagado,
    saldoPendiente: venta.saldoPendiente,
  };
}


// El logo solo se necesita cargar una vez (jsPDF.addImage necesita un
// elemento <img> ya cargado, no solo la URL del asset). Si por lo que sea
// no carga, el ticket se genera igual, sin el logo.
let logoPromise = null;
function loadLogo() {
  if (!logoPromise) {
    logoPromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = logoIndigo;
    });
  }
  return logoPromise;
}

function fieldLine(doc, x, y, label, value) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR.textSecondary);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR.textPrimary);
  doc.text(truncate(String(value || "—"), 42), x, y + 5);
}

function drawCard(doc, { x, y, w, h, title, rows }) {
  doc.setFillColor(...COLOR.background);
  doc.roundedRect(x, y, w, h, 2.5, 2.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLOR.primary);
  doc.text(title.toUpperCase(), x + 6, y + 7);

  rows.forEach((row, i) => fieldLine(doc, x + 6, y + 16 + i * 10, row.label, row.value));
}

/** Header de marca compartido por ambos comprobantes. Regresa el y donde ya se puede seguir dibujando. */
function drawHeader(doc, logo, { title, folio, date }) {
  if (logo) {
    const w = 32;
    const h = (w * logo.height) / logo.width;
    doc.addImage(logo, "PNG", MARGIN, 10, w, h);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...COLOR.dark);
  doc.text(title, RIGHT, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLOR.textSecondary);
  doc.text(`Folio ${folio || "—"}`, RIGHT, 25, { align: "right" });
  doc.text(date, RIGHT, 30.5, { align: "right" });

  doc.setFillColor(...COLOR.primary);
  doc.rect(0, 36, PAGE_WIDTH, 2.2, "F");

  return 48;
}

function drawFooter(doc) {
  const y = 282;
  doc.setDrawColor(...COLOR.light);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, RIGHT, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.primary);
  doc.text("Gracias por su preferencia", PAGE_WIDTH / 2, y + 6, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR.textSecondary);
  doc.text("Indigo One · Sistema de gestión para ópticas", PAGE_WIDTH / 2, y + 11, { align: "center" });
}

function drawChip(doc, { x, y, w, label, value, accent }) {
  const h = 18;
  const fill = accent === "success" ? COLOR.success : COLOR.background;
  const valueColor = accent === "success" ? COLOR.white : COLOR.textPrimary;
  const labelColor = accent === "success" ? COLOR.light : COLOR.textSecondary;
  doc.setFillColor(...fill);
  doc.roundedRect(x, y, w, h, 2.5, 2.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...labelColor);
  doc.text(label.toUpperCase(), x + 5, y + 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...valueColor);
  doc.text(truncate(String(value), 24), x + 5, y + 14);
  return h;
}

/**
 * Cuerpo del comprobante (tarjetas de venta + tabla de productos/servicios
 * + subtotal/IVA/total) - compartido entre el comprobante de venta y el de
 * pago, porque este último debe mostrar la venta completa, no solo el
 * abono. Regresa el y donde ya se puede seguir dibujando.
 */
function drawSaleBody(doc, data, y) {
  const cardW = (CONTENT_WIDTH - 6) / 2;
  const infoCardH = 34;
  drawCard(doc, {
    x: MARGIN, y, w: cardW, h: infoCardH, title: "Detalles de la venta",
    rows: [
      { label: "Sucursal", value: data.branchName },
      { label: "Trabajo", value: data.workSubtypeLabel ? `${data.workTypeLabel} · ${data.workSubtypeLabel}` : data.workTypeLabel },
    ],
  });
  drawCard(doc, {
    x: MARGIN + cardW + 6, y, w: cardW, h: infoCardH, title: "Participantes",
    rows: [
      { label: "Cliente", value: data.patientName },
      { label: "Vendedor", value: data.sellerName },
    ],
  });
  y += infoCardH + 8;

  // Encabezado de la tabla de productos/servicios
  doc.setFillColor(...COLOR.light);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR.dark);
  doc.text("CANT.", MARGIN + 4, y + 5.5);
  doc.text("PRODUCTO / SERVICIO", MARGIN + 20, y + 5.5);
  doc.text("CÓDIGO", 124, y + 5.5);
  doc.text("IMPORTE", RIGHT - 2, y + 5.5, { align: "right" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  (data.items ?? []).forEach((item, idx) => {
    if (y > 258) {
      doc.addPage();
      y = 20;
    }
    if (idx % 2 === 1) {
      doc.setFillColor(...COLOR.background);
      doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "F");
    }
    doc.setTextColor(...COLOR.textPrimary);
    doc.text(String(item.quantity), MARGIN + 4, y + 5);
    doc.text(truncate(item.model, 38), MARGIN + 20, y + 5);
    doc.text(truncate(item.code || "—", 18), 124, y + 5);
    doc.text(money(item.quantity * item.unitPrice), RIGHT - 2, y + 5, { align: "right" });
    y += 7;
  });

  y += 6;
  const totalsX = RIGHT - 70;
  doc.setDrawColor(...COLOR.light);
  doc.setLineWidth(0.3);
  doc.line(totalsX, y, RIGHT, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLOR.textSecondary);
  doc.text("Subtotal", totalsX, y);
  doc.text(money(data.subtotal), RIGHT, y, { align: "right" });
  y += 6;
  doc.text("IVA", totalsX, y);
  doc.text(money(data.iva), RIGHT, y, { align: "right" });
  y += 4;

  doc.setFillColor(...COLOR.primary);
  doc.roundedRect(totalsX, y, 70, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLOR.white);
  doc.text("TOTAL", totalsX + 5, y + 8);
  doc.text(money(data.total), RIGHT - 5, y + 8, { align: "right" });
  y += 12 + 10;

  return y;
}


/**
 * Comprobante de una venta recien confirmada (o reimpreso desde el listado
 * de Ventas) - se descarga solo, sin pasar por el backend real (este modulo
 * aun no existe ahi).
 */
export async function downloadVentaReceipt(data) {
  const logo = await loadLogo();
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = drawHeader(doc, logo, { title: "COMPROBANTE DE VENTA", folio: data.folio, date: data.date });
  y += 4;
  y = drawSaleBody(doc, data, y);

  const chips = [
    { label: "Método de pago", value: data.paymentMethodLabel },
    { label: "Monto pagado", value: money(data.montoPagado) },
  ];
  if (data.saldoPendiente > 0) chips.push({ label: "Saldo pendiente", value: money(data.saldoPendiente) });
  const chipW = (CONTENT_WIDTH - (chips.length - 1) * 4) / chips.length;
  chips.forEach((chip, i) => drawChip(doc, { x: MARGIN + i * (chipW + 4), y, w: chipW, ...chip }));

  drawFooter(doc);
  doc.save(`venta-${data.folio}.pdf`);
}


/**
 * Comprobante de un abono/liquidacion de saldo - muestra la venta completa
 * igual que downloadVentaReceipt (mismos productos, mismo total) porque es
 * justo lo que se está pagando; abajo, en vez de los chips de pago de la
 * venta, muestra el abono que se acaba de registrar y cómo queda el saldo
 * ("Liquidado" en vez de "$0.00" cuando ya no queda nada pendiente). Se
 * descarga al confirmar un pago en LiquidarSaldoPanel.
 */
export async function downloadPaymentReceipt(data) {
  const logo = await loadLogo();
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = drawHeader(doc, logo, { title: "COMPROBANTE DE PAGO", folio: data.folio, date: data.date });
  y += 4;
  y = drawSaleBody(doc, data, y);

  const liquidado = Number(data.saldoPendiente ?? 0) <= 0;
  const chips = [
    { label: "Método de pago", value: data.paymentMethodLabel },
    { label: "Pago de saldo pendiente", value: money(data.montoPagado) },
    liquidado
      ? { label: "Estado", value: "Liquidado", accent: "success" }
      : { label: "Saldo pendiente", value: money(data.saldoPendiente) },
  ];
  const chipW = (CONTENT_WIDTH - (chips.length - 1) * 4) / chips.length;
  chips.forEach((chip, i) => drawChip(doc, { x: MARGIN + i * (chipW + 4), y, w: chipW, ...chip }));

  drawFooter(doc);
  doc.save(`pago-${data.folio}.pdf`);
}
