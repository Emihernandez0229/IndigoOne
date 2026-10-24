import jsPDF from "jspdf";


const money = (value) => `$${Number(value ?? 0).toFixed(2)}`;

/**
 * Comprobante simple de una venta recien confirmada - se descarga solo,
 * sin pasar por el backend real (este modulo aun no existe ahi).
 */
export function downloadVentaReceipt(data) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 20;

  doc.setFontSize(16);
  doc.text("Comprobante de venta", 14, y);
  y += 10;

  doc.setFontSize(10);
  const line = (label, value) => {
    doc.text(`${label}: ${value || "—"}`, 14, y);
    y += 6;
  };

  line("Folio", data.folio);
  line("Fecha", data.date);
  line("Sucursal", data.branchName);
  line("Cliente", data.patientName);
  line("Vendedor", data.sellerName);
  line("Trabajo", data.workTypeLabel);
  if (data.workSubtypeLabel) line("Detalle del trabajo", data.workSubtypeLabel);

  y += 4;
  doc.setFontSize(11);
  doc.text("Productos y servicios", 14, y);
  y += 7;

  doc.setFontSize(9);
  data.items.forEach((item) => {
    doc.text(
      `${item.quantity} x ${item.model}  (${item.code || "—"})`,
      14,
      y
    );
    doc.text(money(item.quantity * item.unitPrice), 180, y, { align: "right" });
    y += 5.5;
  });

  y += 4;
  doc.setLineWidth(0.1);
  doc.line(14, y, 196, y);
  y += 6;

  doc.setFontSize(10);
  doc.text(`Subtotal: ${money(data.subtotal)}`, 196, y, { align: "right" });
  y += 5.5;
  doc.text(`IVA: ${money(data.iva)}`, 196, y, { align: "right" });
  y += 5.5;
  doc.setFontSize(12);
  doc.text(`Total: ${money(data.total)}`, 196, y, { align: "right" });
  y += 8;

  doc.setFontSize(10);
  line("Método de pago", data.paymentMethodLabel);
  line("Monto pagado", money(data.montoPagado));
  if (data.saldoPendiente > 0) line("Saldo pendiente", money(data.saldoPendiente));

  doc.save(`venta-${data.folio}.pdf`);
}


/**
 * Ticket de un abono/liquidacion de saldo - mas corto que el comprobante
 * de venta, se descarga al confirmar un pago en LiquidarSaldoPanel.
 */
export function downloadPaymentReceipt(data) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 20;

  doc.setFontSize(16);
  doc.text("Comprobante de pago", 14, y);
  y += 10;

  doc.setFontSize(10);
  const line = (label, value) => {
    doc.text(`${label}: ${value || "—"}`, 14, y);
    y += 6;
  };

  line("Folio de venta", data.folio);
  line("Fecha", data.date);
  line("Cliente", data.patientName);
  line("Vendedor", data.sellerName);
  line("Método de pago", data.paymentMethodLabel);
  y += 4;

  doc.setFontSize(12);
  doc.text(`Monto pagado: ${money(data.montoPagado)}`, 14, y);
  y += 7;
  doc.setFontSize(10);
  doc.text(`Saldo restante: ${money(data.saldoPendiente)}`, 14, y);

  doc.save(`pago-${data.folio}.pdf`);
}
