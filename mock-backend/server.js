const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let nextId = 1000;
const newId = () => String(nextId++);

// =========================================================
// LOGIN FALSO
// No revisa contraseña, solo mira el prefijo del usuario
// para decidir que rol le regresa. Usa cualquier password.
// =========================================================

const FAKE_USERS = {
  KAT: { id: "u-super", nombre: "Katia", tipo: "indigo", rol: "super_usuario", sucursal_id: null },
  DUE: { id: "u-due-1", nombre: "Urbino", tipo: "indigo", rol: "dueno", sucursal_id: null },
  GTE: { id: "u-gte-1", nombre: "Erick", tipo: "indigo", rol: "gerente_sucursal", sucursal_id: "suc-1" },
  SUB: { id: "u-sub-1", nombre: "Renata", tipo: "indigo", rol: "subgerente", sucursal_id: "suc-1" },
  VTA: { id: "u-vta-1", nombre: "Yoanna", tipo: "indigo", rol: "empleado_ventas", sucursal_id: "suc-1" },
  LAB: { id: "u-lab-1", nombre: "Leo", tipo: "indigo", rol: "empleado_laboratorio", sucursal_id: "suc-1" },
  OPTDUENO: { id: "u-odue-1", nombre: "Sofia", tipo: "optica", rol: "dueno", optica_id: "opt-1", sucursal_id: null },
  OPTGTE: { id: "u-oenc-1", nombre: "Marta", tipo: "optica", rol: "encargado", optica_id: "opt-1", sucursal_id: "osuc-1" },
  OPTEMP: { id: "u-oemp-1", nombre: "Luis", tipo: "optica", rol: "empleado", optica_id: "opt-1", sucursal_id: "osuc-1" },
};

app.post("/api/auth/login", (req, res) => {
  const usuario = String(req.body.usuario || "").toUpperCase();

  const prefix = Object.keys(FAKE_USERS)
    .sort((a, b) => b.length - a.length)
    .find((p) => usuario.startsWith(p));

  if (!prefix) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }

  const base = FAKE_USERS[prefix];

  res.json({
    token: "fake-token-" + prefix,
    usuario: {
      ...base,
      usuario,
      password_pendiente_cambio: false,
    },
  });
});

// =========================================================
// DATOS DE MENTIRA (viven en memoria, se resetean al reiniciar)
// =========================================================

let indigoSucursales = [
  {
    id: "suc-1", displayId: 1, name: "Indigo Tapachula",
    image: "", address: "Av. Central 123", phone: "9611234567",
    country: "México", state: "Chiapas", municipality: "Tapachula",
    manager: "Erick", managerId: "u-gte-1", managerPhone: "9611112222",
    subManager: "Renata", subManagerId: "u-sub-1", subManagerPhone: "9611113333",
    staff: 4, products: 12, customers: 58, labJobs: 9, status: "active",
    staffList: [
      { name: "Erick", role: "Gerente de sucursal" },
      { name: "Renata", role: "Subgerente" },
      { name: "Yoanna", role: "Ventas" },
      { name: "Leo", role: "Laboratorio" },
    ],
  },
  {
    id: "suc-2", displayId: 2, name: "Indigo CDMX",
    image: "", address: "", phone: "",
    country: "México", state: "Ciudad de México", municipality: "Cuauhtémoc",
    manager: "Mariana", managerId: "u-gte-3", managerPhone: "5591112222",
    subManager: "Jorge", subManagerId: "u-sub-2", subManagerPhone: "5591113333",
    staff: 4, products: 0, customers: 0, labJobs: 0, status: "active",
    staffList: [
      { name: "Mariana", role: "Gerente de sucursal" },
      { name: "Jorge", role: "Subgerente" },
      { name: "Carla", role: "Ventas" },
      { name: "Pablo", role: "Laboratorio" },
    ],
  },
  {
    id: "suc-3", displayId: 3, name: "Indigo Monterrey",
    image: "", address: "", phone: "",
    country: "México", state: "Nuevo León", municipality: "Monterrey",
    manager: "Diego", managerId: "u-gte-4", managerPhone: "8191112222",
    subManager: null, subManagerId: null, subManagerPhone: "",
    staff: 2, products: 0, customers: 0, labJobs: 0, status: "active",
    staffList: [
      { name: "Diego", role: "Gerente de sucursal" },
      { name: "Sofia", role: "Ventas" },
    ],
  },
];

let indigoUsuarios = [
  { id: "u-super", displayId: 1, name: "Katia", username: "KAT", role: "indigo:super_usuario", branchId: null, branchName: "Sin sucursal", status: "active", phone: "" },
  { id: "u-due-1", displayId: 2, name: "Urbino", username: "DUE111111", role: "indigo:dueno", branchId: null, branchName: "Sin sucursal", status: "active", phone: "" },
  { id: "u-gte-1", displayId: 3, name: "Erick", username: "GTE111111", role: "indigo:gerente_sucursal", branchId: "suc-1", branchName: "Indigo Tapachula", status: "active", phone: "9611112222" },
  { id: "u-gte-2", displayId: 4, name: "Saúl", username: "GTE222222", role: "indigo:gerente_sucursal", branchId: null, branchName: "Sin sucursal", status: "active", phone: "9221234567" },
  { id: "u-sub-1", displayId: 5, name: "Renata", username: "SUB111111", role: "indigo:subgerente", branchId: "suc-1", branchName: "Indigo Tapachula", status: "active", phone: "9611113333" },
  { id: "u-vta-1", displayId: 6, name: "Yoanna", username: "VTA111111", role: "indigo:empleado_ventas", branchId: "suc-1", branchName: "Indigo Tapachula", status: "active", phone: "9612223344" },
  { id: "u-lab-1", displayId: 7, name: "Leo", username: "LAB111111", role: "indigo:empleado_laboratorio", branchId: "suc-1", branchName: "Indigo Tapachula", status: "active", phone: "9613334455" },
  { id: "u-gte-3", displayId: 8, name: "Mariana", username: "GTE333333", role: "indigo:gerente_sucursal", branchId: "suc-2", branchName: "Indigo CDMX", status: "active", phone: "5591112222" },
  { id: "u-sub-2", displayId: 9, name: "Jorge", username: "SUB222222", role: "indigo:subgerente", branchId: "suc-2", branchName: "Indigo CDMX", status: "active", phone: "5591113333" },
  { id: "u-vta-2", displayId: 10, name: "Carla", username: "VTA222222", role: "indigo:empleado_ventas", branchId: "suc-2", branchName: "Indigo CDMX", status: "active", phone: "5592223344" },
  { id: "u-lab-2", displayId: 11, name: "Pablo", username: "LAB222222", role: "indigo:empleado_laboratorio", branchId: "suc-2", branchName: "Indigo CDMX", status: "active", phone: "5593334455" },
  { id: "u-gte-4", displayId: 12, name: "Diego", username: "GTE444444", role: "indigo:gerente_sucursal", branchId: "suc-3", branchName: "Indigo Monterrey", status: "active", phone: "8191112222" },
  { id: "u-vta-3", displayId: 13, name: "Sofia", username: "VTA333333", role: "indigo:empleado_ventas", branchId: "suc-3", branchName: "Indigo Monterrey", status: "active", phone: "8192223344" },
];

// `branches`: cada cliente (optica) puede tener presencia fisica en mas de
// una ciudad, y cada una de esas sucursales la abastece la sucursal de
// Indigo de esa misma plaza (no necesariamente todas la misma) - por eso
// se registra una entrada por sucursal del cliente, cada una con su propia
// sucursal de Indigo asignada, en vez de un solo branchId a nivel cliente.
let indigoClientes = [
  {
    id: "cli-1", displayId: 1, name: "EVPU", code: "CLI-00001", businessName: "EVPU S.A. de C.V.",
    rfc: "EVP9805123A4", type: "Óptica", phone: "9619876543", email: "ventas@evpu.com",
    fiscalAddress: "Av. Central 123, Tapachula, Chiapas", status: "active",
    branches: [
      { id: "cli-1-b1", name: "Tapachula", indigoBranchId: "suc-1", indigoBranchName: "Indigo Tapachula", status: "active" },
      { id: "cli-1-b2", name: "Ciudad de México", indigoBranchId: "suc-2", indigoBranchName: "Indigo CDMX", status: "active" },
    ],
    history: [
      { date: "2025-09-02", amount: 18500 },
      { date: "2025-10-14", amount: 32000 },
      { date: "2025-11-18", amount: 50000 },
    ],
  },
  {
    id: "cli-2", displayId: 2, name: "Óptica Visión", code: "CLI-00002", businessName: "Óptica Visión S.A. de C.V.",
    rfc: "OVI8704217B2", type: "Óptica", phone: "9611234567", email: "contacto@opticavision.com",
    fiscalAddress: "Calle 5 #100, Tapachula, Chiapas", status: "active",
    branches: [
      { id: "cli-2-b1", name: "Tapachula", indigoBranchId: "suc-1", indigoBranchName: "Indigo Tapachula", status: "active" },
    ],
    history: [
      { date: "2025-08-20", amount: 12400 },
      { date: "2025-10-05", amount: 9800 },
    ],
  },
  {
    id: "cli-3", displayId: 3, name: "Centro Óptico", code: "CLI-00003", businessName: "Centro Óptico S.A. de C.V.",
    rfc: "CEO7609186K1", type: "Óptica", phone: "9619875678", email: "info@centroopcio.com",
    fiscalAddress: "Av. Insurgentes 45, Tapachula, Chiapas", status: "inactive",
    branches: [
      { id: "cli-3-b1", name: "Tapachula", indigoBranchId: "suc-1", indigoBranchName: "Indigo Tapachula", status: "inactive" },
    ],
    history: [
      { date: "2025-06-11", amount: 15200 },
    ],
  },
  {
    id: "cli-4", displayId: 4, name: "Visual Center", code: "CLI-00004", businessName: "Visual Center S.A. de C.V.",
    rfc: "VIC9201123F5", type: "Óptica", phone: "5587654321", email: "hola@visualcenter.com",
    fiscalAddress: "Reforma 200, Ciudad de México", status: "active",
    branches: [
      { id: "cli-4-b1", name: "Ciudad de México", indigoBranchId: "suc-2", indigoBranchName: "Indigo CDMX", status: "active" },
    ],
    history: [
      { date: "2025-09-28", amount: 21000 },
      { date: "2025-11-02", amount: 17600 },
    ],
  },
  {
    id: "cli-5", displayId: 5, name: "CDMX Visión", code: "CLI-00005", businessName: "CDMX Visión S.A. de C.V.",
    rfc: "CDV8703128T6", type: "Óptica", phone: "5555337788", email: "info@cdmxvision.com",
    fiscalAddress: "Polanco 88, Ciudad de México", status: "active",
    branches: [
      { id: "cli-5-b1", name: "Ciudad de México", indigoBranchId: "suc-2", indigoBranchName: "Indigo CDMX", status: "active" },
    ],
    history: [],
  },
  {
    id: "cli-6", displayId: 6, name: "Lentes Plus", code: "CLI-00006", businessName: "Lentes Plus S.A. de C.V.",
    rfc: "LPE9107234M7", type: "Óptica", phone: "8122334455", email: "ventas@lentesplus.com",
    fiscalAddress: "Av. Constitución 300, Monterrey, Nuevo León", status: "inactive",
    branches: [
      { id: "cli-6-b1", name: "Monterrey", indigoBranchId: "suc-3", indigoBranchName: "Indigo Monterrey", status: "inactive" },
    ],
    history: [
      { date: "2025-05-15", amount: 8900 },
    ],
  },
  {
    id: "cli-7", displayId: 7, name: "Más Visión", code: "CLI-00007", businessName: "Más Visión S.A. de C.V.",
    rfc: "MVI9506015P3", type: "Óptica", phone: "8126789012", email: "ventas@masvision.com",
    fiscalAddress: "Av. Gómez Morín 150, Monterrey, Nuevo León", status: "active",
    branches: [
      { id: "cli-7-b1", name: "Monterrey", indigoBranchId: "suc-3", indigoBranchName: "Indigo Monterrey", status: "active" },
    ],
    history: [
      { date: "2025-07-09", amount: 11300 },
      { date: "2025-09-19", amount: 14700 },
      { date: "2025-10-30", amount: 19950 },
    ],
  },
];

registrarCrud("/api/indigo/clientes", () => indigoClientes, {
  crear: (body) => {
    const direccion = [body.direccion, body.municipio, body.estado].filter(Boolean).join(", ");
    return {
      id: newId(), displayId: indigoClientes.length + 1,
      code: `CLI-${String(indigoClientes.length + 1).padStart(5, "0")}`,
      name: body.nombre_comercial, businessName: body.razon_social,
      rfc: body.rfc, type: "Óptica", phone: body.telefono, email: body.correo,
      fiscalAddress: direccion, status: "active",
      branches: [
        {
          id: newId(),
          name: body.sucursal_cliente_nombre || body.municipio || body.nombre_comercial,
          indigoBranchId: body.indigo_sucursal_id || null,
          indigoBranchName: body.indigo_sucursal_nombre || null,
          status: "active",
        },
      ],
      history: [],
    };
  },
  actualizar: (body) => {
    const direccion = [body.direccion, body.municipio, body.estado].filter(Boolean).join(", ");
    return {
      name: body.nombre_comercial, businessName: body.razon_social,
      rfc: body.rfc, phone: body.telefono, email: body.correo,
      fiscalAddress: direccion,
    };
  },
});

let indigoLaboratorio = [
  {
    id: "lab-1", displayId: 1, folio: "LAB-000230", branchId: "suc-1", branchName: "Indigo Tapachula",
    clientName: "Óptica Visión", seller: "Yoanna", serviceType: "montaje", biselType: "Manual", quantity: 1, urgent: false,
    labPerson: "Leo", acceptedBy: null, status: "pending",
    entryAt: "2026-10-05T09:15:00", acceptedAt: null, processingAt: null, completedAt: null, deliveredAt: null,
    lossReason: null, workItems: ["Montaje solicitado en armazón del cliente."],
  },
  {
    id: "lab-2", displayId: 2, folio: "LAB-000231", branchId: "suc-1", branchName: "Indigo Tapachula",
    clientName: "EVPU", seller: "Yoanna", serviceType: "bisel", biselType: "Automático", quantity: 2, urgent: true,
    labPerson: "Leo", acceptedBy: "Leo", status: "processing",
    entryAt: "2026-10-03T10:32:00", acceptedAt: "2026-10-03T10:45:00", processingAt: "2026-10-03T11:10:00", completedAt: null, deliveredAt: null,
    lossReason: null, workItems: ["Bisel urgente solicitado, entrega el mismo día.", "Mica colocada en biseladora automática."],
  },
  {
    id: "lab-3", displayId: 3, folio: "LAB-000232", branchId: "suc-1", branchName: "Indigo Tapachula",
    clientName: "Centro Óptico", seller: "Yoanna", serviceType: "tinte", biselType: "Automático", quantity: 1, urgent: false,
    labPerson: "Leo", acceptedBy: "Leo", status: "completed",
    entryAt: "2026-09-28T09:00:00", acceptedAt: "2026-09-28T09:15:00", processingAt: "2026-09-28T09:40:00", completedAt: "2026-09-28T11:05:00", deliveredAt: "2026-09-28T13:20:00",
    lossReason: null, workItems: ["Mica con tinte gris aplicado.", "Bisel automático realizado.", "Control de calidad aprobado.", "Entregado en sucursal."],
  },
  {
    id: "lab-4", displayId: 4, folio: "LAB-000233", branchId: "suc-1", branchName: "Indigo Tapachula",
    clientName: "Óptica Visión", seller: "Yoanna", serviceType: "bisel", biselType: "Automático", quantity: 1, urgent: false,
    labPerson: "Leo", acceptedBy: "Leo", status: "loss",
    entryAt: "2026-09-15T12:00:00", acceptedAt: "2026-09-15T12:10:00", processingAt: "2026-09-15T12:30:00", completedAt: null, deliveredAt: null,
    lossAt: "2026-09-15T13:15:00",
    lossReason: "El lente se rompió durante el proceso de biselado.",
    workItems: ["Mica colocada en biseladora automática.", "El lente se rompió durante el proceso de biselado.", "Se notificó al cliente; se repetirá el trabajo sin costo."],
  },
  {
    id: "lab-5", displayId: 5, folio: "LAB-000234", branchId: "suc-1", branchName: "Indigo Tapachula",
    clientName: "EVPU", seller: "Yoanna", serviceType: "montaje", biselType: "Manual", quantity: 1, urgent: false,
    labPerson: "Leo", acceptedBy: "Leo", status: "warranty",
    entryAt: "2026-08-20T08:40:00", acceptedAt: "2026-08-20T09:00:00", processingAt: "2026-08-20T09:20:00", completedAt: "2026-08-20T10:30:00", deliveredAt: "2026-08-20T12:00:00",
    lossReason: null,
    workItems: ["Mica con tinte colocada.", "Bisel manual aplicado.", "Entregado en sucursal.", "Cliente reportó una rayadura; ingresado a garantía."],
  },
  {
    id: "lab-6", displayId: 6, folio: "LAB-000235", branchId: "suc-2", branchName: "Indigo CDMX",
    clientName: "Visual Center", seller: "Carla", serviceType: "montaje", biselType: "Manual", quantity: 1, urgent: false,
    labPerson: "Pablo", acceptedBy: null, status: "pending",
    entryAt: "2026-10-04T10:00:00", acceptedAt: null, processingAt: null, completedAt: null, deliveredAt: null,
    lossReason: null, workItems: ["Pendiente de confirmar material con el cliente."],
  },
  {
    id: "lab-7", displayId: 7, folio: "LAB-000236", branchId: "suc-2", branchName: "Indigo CDMX",
    clientName: "CDMX Visión", seller: "Carla", serviceType: "bisel", biselType: "Automático", quantity: 3, urgent: true,
    labPerson: "Pablo", acceptedBy: "Pablo", status: "processing",
    entryAt: "2026-10-02T11:50:00", acceptedAt: "2026-10-02T12:05:00", processingAt: "2026-10-02T12:20:00", completedAt: null, deliveredAt: null,
    lossReason: null, workItems: ["3 piezas ingresadas, mismo pedido.", "En proceso de bisel automático."],
  },
  {
    id: "lab-8", displayId: 8, folio: "LAB-000237", branchId: "suc-2", branchName: "Indigo CDMX",
    clientName: "Visual Center", seller: "Carla", serviceType: "bisel", biselType: "Automático", quantity: 1, urgent: false,
    labPerson: "Pablo", acceptedBy: "Pablo", status: "completed",
    entryAt: "2026-09-25T09:25:00", acceptedAt: "2026-09-25T09:40:00", processingAt: "2026-09-25T10:00:00", completedAt: "2026-09-25T11:30:00", deliveredAt: "2026-09-25T14:00:00",
    lossReason: null, workItems: ["Mica colocada.", "Bisel automático aplicado sin incidencias.", "Entregado en sucursal."],
  },
  {
    id: "lab-9", displayId: 9, folio: "LAB-000238", branchId: "suc-3", branchName: "Indigo Monterrey",
    clientName: "Más Visión", seller: "Sofia", serviceType: "montaje", biselType: "Manual", quantity: 1, urgent: false,
    labPerson: "Diego", acceptedBy: null, status: "pending",
    entryAt: "2026-10-01T15:40:00", acceptedAt: null, processingAt: null, completedAt: null, deliveredAt: null,
    lossReason: null, workItems: ["Trabajo registrado, pendiente de aceptar."],
  },
  {
    id: "lab-10", displayId: 10, folio: "LAB-000239", branchId: "suc-3", branchName: "Indigo Monterrey",
    clientName: "Lentes Plus", seller: "Sofia", serviceType: "bisel", biselType: "Automático", quantity: 2, urgent: false,
    labPerson: "Diego", acceptedBy: "Diego", status: "processing",
    entryAt: "2026-09-20T13:15:00", acceptedAt: "2026-09-20T13:30:00", processingAt: "2026-09-20T13:50:00", completedAt: null, deliveredAt: null,
    lossReason: null, workItems: ["2 piezas en proceso de bisel automático."],
  },
  {
    id: "lab-11", displayId: 11, folio: "LAB-000240", branchId: "suc-3", branchName: "Indigo Monterrey",
    clientName: "Más Visión", seller: "Sofia", serviceType: "tinte", biselType: "Automático", quantity: 1, urgent: false,
    labPerson: "Diego", acceptedBy: "Diego", status: "completed",
    entryAt: "2026-07-10T10:10:00", acceptedAt: "2026-07-10T10:25:00", processingAt: "2026-07-10T10:45:00", completedAt: "2026-07-10T12:00:00", deliveredAt: "2026-07-10T15:00:00",
    lossReason: null, workItems: ["Mica con tinte colocada.", "Bisel automático aplicado.", "Entregado en sucursal."],
  },
  {
    id: "lab-12", displayId: 12, folio: "LAB-000241", branchId: "suc-2", branchName: "Indigo CDMX",
    clientName: "Visual Center", seller: "Carla", serviceType: "bisel", biselType: "Automático", quantity: 1, urgent: true,
    labPerson: "Pablo", acceptedBy: "Pablo", status: "loss",
    entryAt: "2026-08-05T11:00:00", acceptedAt: "2026-08-05T11:15:00", processingAt: "2026-08-05T11:40:00", completedAt: null, deliveredAt: null,
    lossAt: "2026-08-05T13:30:00",
    lossReason: "Accidente en la máquina biseladora, la mica quedó inservible.",
    workItems: ["Mica colocada en biseladora.", "Accidente en la máquina biseladora, la mica quedó inservible.", "Se repuso el material desde almacén central."],
  },
  {
    id: "lab-13", displayId: 13, folio: "LAB-000242", branchId: "suc-1", branchName: "Indigo Tapachula",
    clientName: "Centro Óptico", seller: "Yoanna", serviceType: "bisel", biselType: "Ranurado", quantity: 1, urgent: false,
    labPerson: "Leo", acceptedBy: "Leo", status: "loss",
    entryAt: "2026-10-02T09:15:00", acceptedAt: "2026-10-02T09:40:00", processingAt: "2026-10-02T10:10:00", completedAt: null, deliveredAt: null,
    lossAt: "2026-10-02T12:30:00",
    lossReason: "El material presentó un defecto de fábrica (burbuja interna) detectado durante el proceso.",
    workItems: ["Mica colocada en biseladora ranurada.", "El material presentó un defecto de fábrica (burbuja interna).", "Se notificó al cliente."],
  },
  {
    id: "lab-14", displayId: 14, folio: "LAB-000243", branchId: "suc-2", branchName: "Indigo CDMX",
    clientName: "CDMX Visión", seller: "Carla", serviceType: "bisel", biselType: "Perforado", quantity: 2, urgent: true,
    labPerson: "Pablo", acceptedBy: "Pablo", status: "loss",
    entryAt: "2026-10-03T06:05:00", acceptedAt: "2026-10-03T06:25:00", processingAt: "2026-10-03T06:50:00", completedAt: null, deliveredAt: null,
    lossAt: "2026-10-03T09:10:00",
    lossReason: "Fractura durante el perforado para montaje al aire.",
    workItems: ["Mica colocada para perforado al aire.", "Fractura durante el proceso de perforado.", "Se repuso el material y se avisó al cliente."],
  },
  {
    id: "lab-15", displayId: 15, folio: "LAB-000244", branchId: "suc-3", branchName: "Indigo Monterrey",
    clientName: "Lentes Plus", seller: "Sofia", serviceType: "bisel", biselType: "Manual", quantity: 1, urgent: false,
    labPerson: "Diego", acceptedBy: "Diego", status: "loss",
    entryAt: "2026-09-30T14:10:00", acceptedAt: "2026-09-30T14:30:00", processingAt: "2026-09-30T14:55:00", completedAt: null, deliveredAt: null,
    lossAt: "2026-09-30T17:25:00",
    lossReason: "Rayadura profunda detectada en la inspección final.",
    workItems: ["Mica colocada en biseladora manual.", "Rayadura profunda detectada en inspección final.", "Pieza descartada."],
  },
];

// Backfill de campos que el modulo "Trabajos u ordenes" del Empleado de
// Ventas necesita (quien registro el trabajo en el sistema - puede ser
// distinto de quien hizo la venta - y la fecha/hora de entrega prometida).
// Se hace con un .map() en vez de tocar los 15 registros de arriba.
const SELLER_IDS = { Yoanna: "u-vta-1", Carla: "u-vta-2", Sofia: "u-vta-3" };
indigoLaboratorio = indigoLaboratorio.map((job) => ({
  registeredBy: job.seller,
  registeredById: SELLER_IDS[job.seller] || null,
  requestedDeliveryAt: new Date(new Date(job.entryAt).getTime() + 2 * 86400000).toISOString(),
  ...job,
  // "Añadir detalles" (Empleado de Laboratorio) necesita texto + quien lo
  // escribio + cuando, no solo el texto plano que tenian estos 15 iniciales.
  workItems: (job.workItems || []).map((item) =>
    typeof item === "string" ? { text: item, author: job.labPerson || null, at: job.entryAt } : item
  ),
}));

app.get("/api/indigo/mermas", (req, res) => res.json(indigoLaboratorio.filter((job) => job.status === "loss")));

app.get("/api/indigo/laboratorio", (req, res) => res.json(indigoLaboratorio));

function nextLabFolio() {
  const nums = indigoLaboratorio
    .map((j) => parseInt(String(j.folio).replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 229;
  return `LAB-${String(max + 1).padStart(6, "0")}`;
}

// Usada por el Empleado de Ventas al registrar un trabajo nuevo desde
// "Trabajos u ordenes". Siempre nace "pendiente" - lo acepta laboratorio.
app.post("/api/indigo/laboratorio", (req, res) => {
  const body = req.body;
  const branch = indigoSucursales.find((s) => s.id === body.sucursal_id);

  const item = {
    id: newId(), displayId: indigoLaboratorio.length + 1,
    folio: nextLabFolio(),
    branchId: body.sucursal_id || null, branchName: branch?.name || "",
    clientName: body.cliente_nombre, seller: body.vendedor_nombre,
    serviceType: body.tipo_trabajo || "bisel", biselType: body.tipo_bisel, quantity: Number(body.cantidad) || 1,
    urgent: body.tipo_servicio === "urgente",
    labPerson: null, acceptedBy: null, status: "pending",
    entryAt: new Date().toISOString(),
    acceptedAt: null, processingAt: null, completedAt: null, deliveredAt: null, lossAt: null,
    requestedDeliveryAt: body.fecha_entrega && body.hora_entrega ? `${body.fecha_entrega}T${body.hora_entrega}` : null,
    registeredBy: body.registrado_por_nombre || body.vendedor_nombre,
    registeredById: body.registrado_por_id || null,
    lossReason: null, workItems: [],
  };

  indigoLaboratorio.unshift(item);
  res.status(201).json(item);
});

function encontrarTrabajo(id, res) {
  const job = indigoLaboratorio.find((j) => j.id === id);
  if (!job) {
    res.status(404).json({ error: "No encontrado" });
    return null;
  }
  return job;
}

// Acciones del Empleado de Laboratorio sobre un trabajo ya registrado por
// Ventas: aceptar (pendiente -> en proceso), terminar (-> terminado),
// registrar merma (-> merma, con explicacion obligatoria), y agregar una
// entrada al log de "Añadir detalles".

app.patch("/api/indigo/laboratorio/:id/aceptar", (req, res) => {
  const job = encontrarTrabajo(req.params.id, res);
  if (!job) return;
  const now = new Date().toISOString();
  job.status = "processing";
  job.acceptedAt = now;
  job.processingAt = now;
  job.acceptedBy = req.body.nombre || null;
  job.labPerson = job.labPerson || req.body.nombre || null;
  res.json(job);
});

app.patch("/api/indigo/laboratorio/:id/terminar", (req, res) => {
  const job = encontrarTrabajo(req.params.id, res);
  if (!job) return;
  job.status = "completed";
  job.completedAt = new Date().toISOString();
  job.completedBy = req.body.nombre || null;
  res.json(job);
});

app.patch("/api/indigo/laboratorio/:id/merma", (req, res) => {
  const job = encontrarTrabajo(req.params.id, res);
  if (!job) return;
  if (!req.body.motivo) return res.status(400).json({ error: "La explicación de la merma es obligatoria." });
  job.status = "loss";
  job.lossAt = new Date().toISOString();
  job.lossReason = req.body.motivo;
  job.lossBy = req.body.nombre || null;
  res.json(job);
});

app.post("/api/indigo/laboratorio/:id/detalles", (req, res) => {
  const job = encontrarTrabajo(req.params.id, res);
  if (!job) return;
  if (!req.body.texto) return res.status(400).json({ error: "Escribe un detalle del trabajo." });
  const entry = { text: req.body.texto, author: req.body.nombre || null, at: new Date().toISOString() };
  job.workItems = [...(job.workItems || []), entry];
  res.json(job);
});

let indigoInventario = [
  { id: "inv-1", displayId: 1, code: "ARM-001", model: "Aviador Classic", description: "Armazón metálico estilo aviador, clásico y ligero.", color: "Dorado", type: "armazones", material: "OKI Eyewear", gender: "hombre", measurements: "56-17-140", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 48, stockReserved: 6, stockMin: 10, cost: 450, active: true, photos: [
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23c9a15a'/%3E%3Ctext x='50%25' y='50%25' fill='white' font-size='20' text-anchor='middle'%3EFoto 1%3C/text%3E%3C/svg%3E",
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23334155'/%3E%3Ctext x='50%25' y='50%25' fill='white' font-size='20' text-anchor='middle'%3EFoto 2%3C/text%3E%3C/svg%3E",
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%234f46e5'/%3E%3Ctext x='50%25' y='50%25' fill='white' font-size='20' text-anchor='middle'%3EFoto 3%3C/text%3E%3C/svg%3E"
  ] },
  { id: "inv-1b", displayId: 2, code: "ARM-001", model: "Aviador Classic", description: "Armazón metálico estilo aviador, clásico y ligero.", color: "Dorado", type: "armazones", material: "OKI Eyewear", gender: "hombre", measurements: "56-17-140", branchId: "suc-2", branchName: "Indigo CDMX", stockAvailable: 22, stockReserved: 2, stockMin: 10, cost: 450, active: true, photos: [] },
  { id: "inv-1c", displayId: 3, code: "ARM-001", model: "Aviador Classic", description: "Armazón metálico estilo aviador, clásico y ligero.", color: "Dorado", type: "armazones", material: "OKI Eyewear", gender: "hombre", measurements: "56-17-140", branchId: "suc-3", branchName: "Indigo Monterrey", stockAvailable: 8, stockReserved: 0, stockMin: 10, cost: 450, active: true, photos: [] },
  { id: "inv-2", displayId: 4, code: "ARM-002", model: "Wayfarer Mini", description: "Armazón de acetato compacto, ideal para rostros pequeños.", color: "Negro", type: "armazones", material: "JD Sport", gender: "unisex", measurements: "50-19-135", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 3, stockReserved: 1, stockMin: 5, cost: 380, active: true, photos: [] },
  { id: "inv-3", displayId: 5, code: "ARM-003", model: "Round Vintage", description: "Armazón redondo de inspiración vintage.", color: "Carey", type: "armazones", material: "Cactus", gender: "mujer", measurements: "48-20-140", branchId: "suc-2", branchName: "Indigo CDMX", stockAvailable: 0, stockReserved: 0, stockMin: 4, cost: 500, active: true, photos: [] },
  { id: "inv-4", displayId: 6, code: "MIC-001", model: "Progresiva HD", description: "Mica progresiva de alta definición.", color: "Transparente", type: "micas", material: "Progresivos Superfit", gender: "unisex", measurements: "70mm", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 14, stockReserved: 4, stockMin: 8, cost: 900, active: true, photos: [] },
  { id: "inv-5", displayId: 7, code: "ACC-001", model: "Cordón para lentes ajustable", description: "Cordón ajustable para sujetar lentes.", color: "Negro", type: "accesorios", material: "Nylon", gender: "unisex", measurements: "70cm", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 120, stockReserved: 10, stockMin: 20, cost: 35, active: true, photos: [] },
  { id: "inv-5b", displayId: 8, code: "ACC-001", model: "Cordón para lentes ajustable", description: "Cordón ajustable para sujetar lentes.", color: "Negro", type: "accesorios", material: "Nylon", gender: "unisex", measurements: "70cm", branchId: "suc-2", branchName: "Indigo CDMX", stockAvailable: 95, stockReserved: 5, stockMin: 20, cost: 35, active: true, photos: [] },
  { id: "inv-6", displayId: 9, code: "ACC-002", model: "Paño de microfibra", description: "Paño de microfibra para limpieza de lentes.", color: "Azul", type: "accesorios", material: "Microfibra", gender: "unisex", measurements: "15x15 cm", branchId: "suc-3", branchName: "Indigo Monterrey", stockAvailable: 260, stockReserved: 0, stockMin: 30, cost: 18, active: true, photos: [] },
  { id: "inv-7", displayId: 10, code: "EST-001", model: "Estuche rígido con cierre", description: "Estuche rígido con cierre para armazones.", color: "Negro", type: "estuches", material: "EVA", gender: "unisex", measurements: "16x6x5 cm", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 85, stockReserved: 8, stockMin: 15, cost: 60, active: true, photos: [] },
  { id: "inv-7b", displayId: 11, code: "EST-001", model: "Estuche rígido con cierre", description: "Estuche rígido con cierre para armazones.", color: "Negro", type: "estuches", material: "EVA", gender: "unisex", measurements: "16x6x5 cm", branchId: "suc-2", branchName: "Indigo CDMX", stockAvailable: 40, stockReserved: 2, stockMin: 15, cost: 60, active: true, photos: [] },
  { id: "inv-8", displayId: 12, code: "OTR-001", model: "Kit de destornilladores para lentes", description: "Kit de mini destornilladores para ajuste de armazones.", color: "Gris", type: "otros", material: "Metal", gender: "unisex", measurements: "N/A", branchId: "suc-2", branchName: "Indigo CDMX", stockAvailable: 18, stockReserved: 0, stockMin: 5, cost: 45, active: true, photos: [] },
  { id: "inv-9", displayId: 13, code: "ARM-004", model: "Armazón al aire titanio", description: "Armazón al aire de titanio, ultraligero.", color: "Plata", type: "armazones", material: "Friend", gender: "hombre", measurements: "54-18-140", branchId: "suc-2", branchName: "Indigo CDMX", stockAvailable: 0, stockReserved: 0, stockMin: 6, cost: 1150, active: true, photos: [] },
  { id: "inv-10", displayId: 14, code: "ARM-005", model: "Armazón infantil flexible", description: "Armazón flexible resistente para niños.", color: "Azul", type: "armazones", material: "Toki Kids", gender: "unisex", measurements: "44-16-125", branchId: "suc-3", branchName: "Indigo Monterrey", stockAvailable: 6, stockReserved: 1, stockMin: 8, cost: 420, active: true, photos: [] },
];

let opticaSucursales = [
  { id: "osuc-1", displayId: 1, name: "Optica Centro", address: "Calle 5 #100", phone: "9611112222", manager: "Marta", managerId: "u-oenc-1", staff: 2, products: 5, status: "active" },
  { id: "osuc-2", displayId: 2, name: "Optica Norte", address: "Av. Norte 300", phone: "9613334444", manager: null, managerId: null, staff: 0, products: 0, status: "active" },
];

let opticaUsuarios = [
  { id: "u-odue-1", displayId: 1, name: "Sofia", username: "OPTDUENO1", role: "optica:dueno", branchId: null, branchName: "Sin sucursal", status: "active" },
  { id: "u-oenc-1", displayId: 2, name: "Marta", username: "OPTGTE1", role: "optica:encargado", branchId: "osuc-1", branchName: "Optica Centro", status: "active" },
  { id: "u-oemp-1", displayId: 3, name: "Luis", username: "OPTEMP1", role: "optica:empleado", branchId: "osuc-1", branchName: "Optica Centro", status: "active" },
];

let opticaInventario = [
  { id: "oinv-1", displayId: 1, code: "OPT-001", model: "Redonda Slim", description: "Armazón redondo delgado, línea premium.", color: "Azul", type: "armazones", material: "Life", gender: "mujer", measurements: "50-18-138", branchId: "osuc-1", branchName: "Optica Centro", stockAvailable: 6, stockReserved: 1, stockMin: 4, cost: 620, active: true, photos: [] },
  { id: "oinv-1b", displayId: 2, code: "OPT-001", model: "Redonda Slim", description: "Armazón redondo delgado, línea premium.", color: "Azul", type: "armazones", material: "Life", gender: "mujer", measurements: "50-18-138", branchId: "osuc-2", branchName: "Optica Norte", stockAvailable: 3, stockReserved: 0, stockMin: 4, cost: 620, active: true, photos: [] },
  { id: "oinv-2", displayId: 3, code: "OPT-002", model: "Clasica", description: "Armazón clásico de pasta.", color: "Café", type: "armazones", material: "Fashion", gender: "unisex", measurements: "52-19-140", branchId: "osuc-1", branchName: "Optica Centro", stockAvailable: 0, stockReserved: 0, stockMin: 3, cost: 300, active: true, photos: [] },
  { id: "oinv-3", displayId: 4, code: "MIC-OPT-001", model: "Antireflejante Plus", description: "Mica con tratamiento antirreflejante.", color: "Transparente", type: "micas", material: "Resistant Flex", gender: "unisex", measurements: "65mm", branchId: "osuc-1", branchName: "Optica Centro", stockAvailable: 9, stockReserved: 2, stockMin: 5, cost: 480, active: true, photos: [] },
];

// =========================================================
// HELPERS: registran GET/POST/PUT/PATCH genéricos para un
// arreglo en memoria, imitando lo que hará el backend real.
// =========================================================

function registrarCrud(basePath, getStore, extra = {}) {

  app.get(basePath, (req, res) => res.json(getStore()));

  app.post(basePath, (req, res) => {
    const item = extra.crear ? extra.crear(req.body) : req.body;
    getStore().unshift(item);
    res.status(201).json(item);
  });

  app.put(`${basePath}/:id`, (req, res) => {
    const store = getStore();
    const idx = store.findIndex((row) => row.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "No encontrado" });
    store[idx] = { ...store[idx], ...(extra.actualizar ? extra.actualizar(req.body, store[idx]) : req.body) };
    res.json(store[idx]);
  });

  app.patch(`${basePath}/:id/deactivate`, (req, res) => {
    const store = getStore();
    const idx = store.findIndex((row) => row.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "No encontrado" });
    store[idx] = { ...store[idx], status: "inactive", active: false };
    res.json(store[idx]);
  });

  app.patch(`${basePath}/:id/activate`, (req, res) => {
    const store = getStore();
    const idx = store.findIndex((row) => row.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "No encontrado" });
    store[idx] = { ...store[idx], status: "active", active: true };
    res.json(store[idx]);
  });

}

// ---- Indigo ----

// Si en el form de sucursal se escribe un nombre en "nuevo gerente" (porque
// no habia ningun gerente disponible para asignar), aqui se da de alta ese
// gerente de verdad en indigoUsuarios, para que aparezca tambien en el
// modulo Personal - no solo como texto suelto en la sucursal.
function crearGerenteParaSucursal(nombre, branchId, branchName) {
  const id = newId();
  indigoUsuarios.unshift({
    id, displayId: indigoUsuarios.length + 1,
    name: nombre, username: "NEW" + Math.floor(Math.random() * 10000),
    role: "indigo:gerente_sucursal", branchId, branchName,
    status: "active", phone: "",
  });
  return id;
}

registrarCrud("/api/indigo/sucursales", () => indigoSucursales, {
  crear: (body) => {
    const id = newId();
    const nombreSucursal = body.nombre;

    let managerId = body.gerente_indigo_usuario_id || null;
    let managerName = null;

    if (body.nuevo_gerente_nombre) {
      managerId = crearGerenteParaSucursal(body.nuevo_gerente_nombre, id, nombreSucursal);
      managerName = body.nuevo_gerente_nombre;
    } else if (managerId) {
      managerName = indigoUsuarios.find((u) => u.id === managerId)?.name || null;
    }

    return {
      id, displayId: indigoSucursales.length + 1,
      name: nombreSucursal, image: body.imagen || "", address: "", phone: "",
      country: body.pais || "", state: body.estado || "", municipality: body.municipio || "",
      manager: managerName, managerId,
      managerPhone: "", subManager: null, subManagerId: null, subManagerPhone: "",
      staff: managerId ? 1 : 0, products: 0, customers: 0, labJobs: 0, status: "active",
      staffList: managerId ? [{ name: managerName, role: "Gerente de sucursal" }] : [],
    };
  },
  // El PUT lo usan dos formularios distintos (edicion completa del Dueño,
  // y la edicion acotada de "Mi sucursal" del Gerente/Subgerente), cada uno
  // manda solo sus propios campos - por eso el patch se arma condicional,
  // nunca pisando con `undefined` lo que el otro formulario no mando.
  actualizar: (body, existingRow) => {
    const patch = {};

    if (body.nombre !== undefined) patch.name = body.nombre;
    if (body.pais !== undefined) patch.country = body.pais;
    if (body.estado !== undefined) patch.state = body.estado;
    if (body.municipio !== undefined) patch.municipality = body.municipio;

    if (body.nuevo_gerente_nombre) {
      patch.managerId = crearGerenteParaSucursal(body.nuevo_gerente_nombre, existingRow.id, body.nombre || existingRow.name);
      patch.manager = body.nuevo_gerente_nombre;
    } else if (body.gerente_indigo_usuario_id !== undefined) {
      patch.managerId = body.gerente_indigo_usuario_id || null;
      patch.manager = body.manager ?? null;
    }

    if (body.direccion !== undefined) patch.address = body.direccion;
    if (body.telefono !== undefined) patch.phone = body.telefono;
    if (body.gerente_telefono !== undefined) patch.managerPhone = body.gerente_telefono;
    if (body.subgerente_nombre !== undefined) patch.subManager = body.subgerente_nombre;
    if (body.subgerente_telefono !== undefined) patch.subManagerPhone = body.subgerente_telefono;

    return patch;
  },
});

app.get("/api/indigo/sucursales/gerentes-disponibles", (req, res) => {
  const currentManagerId = req.query.gerente_actual_id;
  const asignados = new Set(indigoSucursales.map((s) => s.managerId).filter(Boolean));
  const disponibles = indigoUsuarios.filter(
    (u) => u.role === "indigo:gerente_sucursal" &&
      (!asignados.has(u.id) || u.id === currentManagerId)
  );
  res.json(disponibles.map((u) => ({ id: u.id, nombre: u.name })));
});

registrarCrud("/api/indigo/usuarios", () => indigoUsuarios, {
  crear: (body) => ({
    id: newId(), displayId: indigoUsuarios.length + 1,
    name: body.nombre, username: "NEW" + Math.floor(Math.random() * 10000),
    role: "indigo:empleado_ventas", branchId: body.sucursal_id || null,
    branchName: "Indigo Tapachula", status: "active",
  }),
  // El Gerente/Subgerente edita nombre, telefono, correo y puesto/rol del
  // empleado desde el modulo de Empleados - nunca la sucursal (esa queda
  // fija, asignada automaticamente).
  actualizar: (body) => {
    const patch = {};
    if (body.nombre !== undefined) patch.name = body.nombre;
    if (body.telefono !== undefined) patch.phone = body.telefono;
    if (body.correo !== undefined) patch.email = body.correo;
    if (body.puesto !== undefined) patch.role = body.puesto;
    return patch;
  },
});

// Rutas por rol que realmente usa createUser() del front (el POST generico
// de arriba no se llama nunca para Indigo, pero se deja por compatibilidad).
function crearUsuarioIndigo(body, role) {
  const branch = indigoSucursales.find((s) => s.id === body.sucursal_id);
  const item = {
    id: newId(), displayId: indigoUsuarios.length + 1,
    name: body.nombre, username: body.usuario || "NEW" + Math.floor(Math.random() * 10000),
    role, branchId: body.sucursal_id || null,
    branchName: branch?.name || body.nueva_sucursal_nombre || "Sin asignar",
    status: "active", phone: body.telefono || "", email: body.correo || "",
  };
  indigoUsuarios.unshift(item);
  return item;
}

app.post("/api/indigo/usuarios/gerentes", (req, res) => {
  res.status(201).json(crearUsuarioIndigo(req.body, "indigo:gerente_sucursal"));
});

app.post("/api/indigo/usuarios/subgerentes", (req, res) => {
  res.status(201).json(crearUsuarioIndigo(req.body, "indigo:subgerente"));
});

app.post("/api/indigo/usuarios/empleados", (req, res) => {
  const role = req.body.tipo === "laboratorio" ? "indigo:empleado_laboratorio" : "indigo:empleado_ventas";
  res.status(201).json(crearUsuarioIndigo(req.body, role));
});

app.get("/api/indigo/usuarios/opciones-formulario", (req, res) => {
  res.json({
    roles: [
      { value: "INDIGO_BRANCH_MANAGER", label: "Gerente de sucursal" },
      { value: "INDIGO_SUBGERENTE", label: "Subgerente" },
      { value: "INDIGO_SALES", label: "Ventas" },
      { value: "INDIGO_LAB", label: "Laboratorio" },
    ],
    sucursales: indigoSucursales.map((s) => ({ value: s.id, label: s.name })),
    sucursalesGerente: indigoSucursales.filter((s) => !s.managerId).map((s) => ({ value: s.id, label: s.name })),
  });
});

app.get("/api/indigo/dashboard", (req, res) => {
  res.json({
    branches: indigoSucursales.map((s) => ({ id: s.id, name: s.name })),
    branchName: "Indigo Tapachula",
    kpis: {
      sucursalesActivas: indigoSucursales.length,
      ventasHoy: 4200, cantidadVentasHoy: 9, ordenesLaboratorio: 29,
      clientes: 186, clientesActivos: 162, clientesInactivos: 24,
      empleados: 4, ventas: 9, totalVentas: 4200,
      productosDisponibles: indigoInventario.filter((i) => i.active).length,
      pendientes: 2, enProceso: 1, total: 3,
    },
    salesByBranch: indigoSucursales.map((s, i) => ({
      id: s.id, name: s.name, sales: 2100 + i * 950,
      color: ["#3B82F6", "#EC4899", "#A855F7", "#F97316", "#22A06B"][i % 5],
    })),
    salesByEmployee: [{ name: "Yoanna", sales: 2100 }],
    salesByPeriod: {
      week: [
        { name: "Lun", sales: 1200 }, { name: "Mar", sales: 1800 }, { name: "Mié", sales: 900 },
        { name: "Jue", sales: 2100 }, { name: "Vie", sales: 2600 }, { name: "Sáb", sales: 1700 }, { name: "Dom", sales: 600 },
      ],
      month: [
        { name: "Sem 1", sales: 8200 }, { name: "Sem 2", sales: 9600 }, { name: "Sem 3", sales: 7400 }, { name: "Sem 4", sales: 10100 },
      ],
      year: [
        { name: "Ene", sales: 32000 }, { name: "Feb", sales: 29500 }, { name: "Mar", sales: 35200 }, { name: "Abr", sales: 31800 },
        { name: "May", sales: 38400 }, { name: "Jun", sales: 36100 },
      ],
    },
    laboratoryByStatus: [
      { label: "En proceso", value: 8, color: "#5565C8" },
      { label: "Completados", value: 14, color: "#22A06B" },
      { label: "Pendientes", value: 5, color: "#F59E0B" },
      { label: "Cancelados", value: 2, color: "#E5484D" },
    ],
    mermasRegistradas: 6,
    laboratory: [
      { id: "1", order: "LAB-001", customer: "Cliente 1", status: "pending" },
      { id: "2", order: "LAB-002", customer: "Cliente 2", status: "processing" },
      { id: "3", order: "LAB-003", customer: "Cliente 3", status: "completed" },
    ],
    team: [{ id: "u-vta-1", name: "Yoanna", role: "Ventas", sales: "$2,100" }],
    recentSales: [{ id: "1", client: "Juan Pérez", amount: "$850", status: "completed" }],
    myLabOrders: [{ id: "1", order: "LAB-001", status: "processing" }],
    reports: { sales: "$4,200", customers: "12", jobs: "3" },
  });
});

registrarCrud("/api/indigo/inventario", () => indigoInventario, {
  crear: (body) => ({
    id: newId(), displayId: indigoInventario.length + 1,
    code: body.codigo, model: body.modelo, description: body.descripcion || "",
    color: body.color, type: body.tipo, material: body.material, gender: body.genero,
    measurements: body.medidas, branchId: body.sucursal_id || null,
    branchName: indigoSucursales.find((s) => s.id === body.sucursal_id)?.name || "Sin sucursal",
    stockAvailable: Number(body.stock_disponible), stockReserved: 0, stockMin: Number(body.stock_minimo),
    cost: Number(body.costo), active: true, photos: Array.isArray(body.fotos) ? body.fotos : [],
  }),
  actualizar: (body) => ({
    code: body.codigo, model: body.modelo, description: body.descripcion || "",
    color: body.color, type: body.tipo, material: body.material, gender: body.genero,
    measurements: body.medidas,
    stockAvailable: Number(body.stock_disponible), stockMin: Number(body.stock_minimo),
    cost: Number(body.costo), photos: Array.isArray(body.fotos) ? body.fotos : [],
  }),
});

// ---- Ópticas ----

registrarCrud("/api/opticas/sucursales", () => opticaSucursales, {
  crear: (body) => ({
    id: newId(), displayId: opticaSucursales.length + 1,
    name: body.nombre, address: body.direccion || null, phone: body.telefono || null,
    manager: body.nuevo_gerente_nombre || null, managerId: body.gerente_optica_usuario_id || null,
    staff: 0, products: 0, status: "active",
  }),
  actualizar: (body) => ({
    name: body.nombre, address: body.direccion || null, phone: body.telefono || null,
  }),
});

app.get("/api/opticas/sucursales/gerentes-disponibles", (req, res) => {
  res.json([{ id: "u-oenc-2", nombre: "Ana" }]);
});

registrarCrud("/api/opticas/usuarios", () => opticaUsuarios, {
  crear: (body) => ({
    id: newId(), displayId: opticaUsuarios.length + 1,
    name: body.nombre, username: "NEW" + Math.floor(Math.random() * 10000),
    role: "optica:empleado", branchId: body.sucursal_id || null,
    branchName: "Optica Centro", status: "active",
  }),
});

app.get("/api/opticas/usuarios/opciones-formulario", (req, res) => {
  res.json({
    roles: [
      { value: "OPTICA_BRANCH_MANAGER", label: "Jefe de sucursal" },
      { value: "OPTICA_SALES", label: "Ventas" },
    ],
    sucursales: opticaSucursales.map((s) => ({ value: s.id, label: s.name })),
    sucursalesGerente: opticaSucursales.filter((s) => !s.managerId).map((s) => ({ value: s.id, label: s.name })),
  });
});

app.get("/api/opticas/dashboard", (req, res) => {
  res.json({
    branches: opticaSucursales.map((s) => ({ id: s.id, name: s.name })),
    branchName: "Optica Centro",
    kpis: {
      sucursalesActivas: opticaSucursales.length,
      ventasHoy: 1800, cantidadVentasHoy: 5, ordenesLaboratorio: 2,
      empleados: 2, ventas: 5, totalVentas: 1800,
      pendientes: 1, enProceso: 1, total: 2,
    },
    salesByBranch: opticaSucursales.map((s) => ({ id: s.id, branch: s.name, sales: 5, total: 1800 })),
    salesByEmployee: [{ name: "Luis", sales: 1800 }],
    laboratory: [{ id: "1", order: "LAB-OPT-001", customer: "Cliente Óptica", status: "pending" }],
    team: [{ id: "u-oemp-1", name: "Luis", role: "Ventas", sales: "$1,800" }],
    recentSales: [{ id: "1", client: "María López", amount: "$450", status: "completed" }],
    myLabOrders: [{ id: "1", order: "LAB-OPT-001", status: "processing" }],
    reports: { sales: "$1,800", customers: "6", jobs: "2" },
  });
});

registrarCrud("/api/opticas/inventario", () => opticaInventario, {
  crear: (body) => ({
    id: newId(), displayId: opticaInventario.length + 1,
    code: body.codigo, model: body.modelo, description: body.descripcion || "",
    color: body.color, type: body.tipo, material: body.material, gender: body.genero,
    measurements: body.medidas, branchId: body.sucursal_id || null,
    branchName: opticaSucursales.find((s) => s.id === body.sucursal_id)?.name || "Sin asignar",
    stockAvailable: Number(body.stock_disponible), stockReserved: 0, stockMin: Number(body.stock_minimo),
    cost: Number(body.costo), active: true, photos: Array.isArray(body.fotos) ? body.fotos : [],
  }),
  actualizar: (body) => ({
    code: body.codigo, model: body.modelo, description: body.descripcion || "",
    color: body.color, type: body.tipo, material: body.material, gender: body.genero,
    measurements: body.medidas,
    stockAvailable: Number(body.stock_disponible), stockMin: Number(body.stock_minimo),
    cost: Number(body.costo), photos: Array.isArray(body.fotos) ? body.fotos : [],
  }),
});

let opticaPacientes = [
  { id: "opac-1", sucursal_id: "osuc-1", nombre: "JUAN PÉREZ", telefono: "9611234567", email: "juan@example.com", fecha_nacimiento: "1990-05-20", created_at: "2026-01-10T10:00:00.000Z", updated_at: "2026-01-10T10:00:00.000Z", active: true },
  { id: "opac-2", sucursal_id: "osuc-1", nombre: "MARÍA LÓPEZ", telefono: "9619876543", email: "maria@example.com", fecha_nacimiento: "1985-11-02", created_at: "2026-02-05T10:00:00.000Z", updated_at: "2026-02-05T10:00:00.000Z", active: true },
  { id: "opac-3", sucursal_id: "osuc-2", nombre: "CARLOS RUIZ", telefono: "9615551234", email: null, fecha_nacimiento: null, created_at: "2026-03-01T10:00:00.000Z", updated_at: "2026-03-01T10:00:00.000Z", active: true },
];

// Imita el contrato real de /api/opticas/pacientes: respuestas envueltas
// en { ok, paciente } / { ok, pacientes }. Los endpoints /deactivate y
// /activate NO existen en el backend real todavía (ver aviso al final).

app.get("/api/opticas/pacientes/sucursal/:sucursalId", (req, res) => {
  const pacientes = opticaPacientes.filter((p) => p.sucursal_id === req.params.sucursalId);
  res.json({ ok: true, pacientes });
});

app.get("/api/opticas/pacientes/:id", (req, res) => {
  const paciente = opticaPacientes.find((p) => p.id === req.params.id);
  if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });
  res.json({ ok: true, paciente });
});

app.post("/api/opticas/pacientes", (req, res) => {
  const body = req.body;
  const paciente = {
    id: newId(),
    sucursal_id: body.sucursalId || "osuc-1",
    nombre: String(body.nombre || "").toUpperCase(),
    telefono: body.telefono || null,
    email: body.email || null,
    fecha_nacimiento: body.fechaNacimiento || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    active: true,
  };
  opticaPacientes.unshift(paciente);
  res.status(201).json({ ok: true, paciente });
});

app.patch("/api/opticas/pacientes/:id", (req, res) => {
  const idx = opticaPacientes.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Paciente no encontrado" });
  const body = req.body;
  opticaPacientes[idx] = {
    ...opticaPacientes[idx],
    nombre: body.nombre !== undefined ? String(body.nombre).toUpperCase() : opticaPacientes[idx].nombre,
    telefono: body.telefono !== undefined ? body.telefono : opticaPacientes[idx].telefono,
    email: body.email !== undefined ? body.email : opticaPacientes[idx].email,
    fecha_nacimiento: body.fechaNacimiento !== undefined ? body.fechaNacimiento : opticaPacientes[idx].fecha_nacimiento,
    updated_at: new Date().toISOString(),
  };
  res.json({ ok: true, paciente: opticaPacientes[idx] });
});

// NO existen todavía en el backend real (propuesta de contrato):
app.patch("/api/opticas/pacientes/:id/deactivate", (req, res) => {
  const idx = opticaPacientes.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Paciente no encontrado" });
  opticaPacientes[idx] = { ...opticaPacientes[idx], active: false };
  res.json({ ok: true, paciente: opticaPacientes[idx] });
});

app.patch("/api/opticas/pacientes/:id/activate", (req, res) => {
  const idx = opticaPacientes.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Paciente no encontrado" });
  opticaPacientes[idx] = { ...opticaPacientes[idx], active: true };
  res.json({ ok: true, paciente: opticaPacientes[idx] });
});

function daysFromNow(days, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

let opticaCitas = [
  { id: "ocit-1", sucursal_id: "osuc-1", cliente_final_id: "opac-1", fecha_hora: daysFromNow(1, 10), motivo: "Revisión anual", estado: "programada", creado_por: "u-oenc-1", created_at: daysFromNow(-2) },
  { id: "ocit-2", sucursal_id: "osuc-1", cliente_final_id: "opac-2", fecha_hora: daysFromNow(2, 12), motivo: "Ajuste de armazón", estado: "confirmada", creado_por: "u-oemp-1", created_at: daysFromNow(-3) },
  { id: "ocit-3", sucursal_id: "osuc-1", cliente_final_id: "opac-1", fecha_hora: daysFromNow(-1, 9), motivo: "Entrega de lentes", estado: "atendida", creado_por: "u-oenc-1", created_at: daysFromNow(-5) },
  { id: "ocit-5", sucursal_id: "osuc-1", cliente_final_id: "opac-2", fecha_hora: daysFromNow(-2, 11), motivo: "Revisión de graduación", estado: "cancelada", creado_por: "u-oenc-1", created_at: daysFromNow(-6) },
  { id: "ocit-6", sucursal_id: "osuc-1", cliente_final_id: "opac-1", fecha_hora: daysFromNow(-3, 17), motivo: "Consulta de seguimiento", estado: "no_asistio", creado_por: "u-oemp-1", created_at: daysFromNow(-7) },
  { id: "ocit-4", sucursal_id: "osuc-2", cliente_final_id: "opac-3", fecha_hora: daysFromNow(3, 16), motivo: "Consulta inicial", estado: "programada", creado_por: "u-odue-1", created_at: daysFromNow(-1) },
  { id: "ocit-7", sucursal_id: "osuc-2", cliente_final_id: "opac-3", fecha_hora: daysFromNow(4, 9), motivo: "Adaptación de lentes de contacto", estado: "confirmada", creado_por: "u-odue-1", created_at: daysFromNow(-2) },
];

// Contrato propuesto para citas: respuestas { success, data } (igual que
// devuelve hoy el controller real), con ?sucursalId= en el listado para
// que el dueño pueda elegir sucursal (el back real hoy solo usa
// req.user.sucursalId, que además está roto - ver aviso al final).

app.get("/api/opticas/citas", (req, res) => {
  const { sucursalId } = req.query;
  const citas = opticaCitas.filter((c) => c.sucursal_id === sucursalId);
  res.json({ success: true, data: citas });
});

app.get("/api/opticas/citas/:id", (req, res) => {
  const cita = opticaCitas.find((c) => c.id === req.params.id);
  if (!cita) return res.status(404).json({ error: "Cita no encontrada" });
  res.json({ success: true, data: cita });
});

app.post("/api/opticas/citas", (req, res) => {
  const body = req.body;
  const cita = {
    id: newId(),
    sucursal_id: body.sucursalId || "osuc-1",
    cliente_final_id: body.clienteId,
    fecha_hora: body.fechaHora,
    motivo: body.motivo,
    estado: "programada",
    creado_por: "mock-user",
    created_at: new Date().toISOString(),
  };
  opticaCitas.unshift(cita);
  res.status(201).json({ success: true, data: cita });
});

app.patch("/api/opticas/citas/:id", (req, res) => {
  const idx = opticaCitas.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Cita no encontrada" });
  const body = req.body;
  opticaCitas[idx] = {
    ...opticaCitas[idx],
    fecha_hora: body.fechaHora !== undefined ? body.fechaHora : opticaCitas[idx].fecha_hora,
    motivo: body.motivo !== undefined ? body.motivo : opticaCitas[idx].motivo,
  };
  res.json({ success: true, data: opticaCitas[idx] });
});

app.patch("/api/opticas/citas/:id/estado", (req, res) => {
  const idx = opticaCitas.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Cita no encontrada" });
  opticaCitas[idx] = { ...opticaCitas[idx], estado: req.body.estado };
  res.json({ success: true, data: opticaCitas[idx] });
});

let opticaVentas = [
  {
    id: "oven-1", sucursal_id: "osuc-1", paciente_id: "opac-1", metodo_pago: "efectivo",
    estado: "completada", creado_por: "u-oenc-1", created_at: daysFromNow(-1),
    items: [{ producto_id: "oinv-1", codigo: "OPT-001", modelo: "Redonda Slim", cantidad: 1, precio_unitario: 620, subtotal: 620 }],
    subtotal: 620, iva: 99.2, total: 719.2, monto_pagado: 719.2, saldo_pendiente: 0,
  },
  {
    id: "oven-2", sucursal_id: "osuc-1", paciente_id: "opac-1", metodo_pago: "credito",
    estado: "completada", creado_por: "u-oemp-1", created_at: daysFromNow(0),
    items: [{ producto_id: "oinv-3", codigo: "MIC-OPT-001", modelo: "Antireflejante Plus", cantidad: 2, precio_unitario: 480, subtotal: 960 }],
    subtotal: 960, iva: 153.6, total: 1113.6, monto_pagado: 700, saldo_pendiente: 413.6,
  },
  {
    id: "oven-3", sucursal_id: "osuc-1", paciente_id: "opac-2", metodo_pago: "efectivo",
    estado: "cancelada", creado_por: "u-oenc-1", created_at: daysFromNow(-3),
    items: [{ producto_id: "oinv-1", codigo: "OPT-001", modelo: "Redonda Slim", cantidad: 1, precio_unitario: 620, subtotal: 620 }],
    subtotal: 620, iva: 99.2, total: 719.2, monto_pagado: 719.2, saldo_pendiente: 0,
  },
  {
    id: "oven-4", sucursal_id: "osuc-2", paciente_id: "opac-3", metodo_pago: "transferencia",
    estado: "completada", creado_por: "u-odue-1", created_at: daysFromNow(-2),
    items: [{ producto_id: "oinv-1b", codigo: "OPT-001", modelo: "Redonda Slim", cantidad: 1, precio_unitario: 620, subtotal: 620 }],
    subtotal: 620, iva: 99.2, total: 719.2, monto_pagado: 719.2, saldo_pendiente: 0,
  },
];

// Contrato propuesto para ventas (modulo nuevo, sin nada en el back real):
// respuestas { ok, venta } / { ok, ventas }, con ?sucursalId= en el listado
// igual que pacientes/citas. Al crear una venta se descuenta el stock del
// producto en opticaInventario; al cancelar, se repone.

app.get("/api/opticas/ventas", (req, res) => {
  const { sucursalId } = req.query;
  const ventas = opticaVentas.filter((v) => v.sucursal_id === sucursalId);
  res.json({ ok: true, ventas });
});

app.get("/api/opticas/ventas/:id", (req, res) => {
  const venta = opticaVentas.find((v) => v.id === req.params.id);
  if (!venta) return res.status(404).json({ error: "Venta no encontrada" });
  res.json({ ok: true, venta });
});

app.post("/api/opticas/ventas", (req, res) => {
  const body = req.body;

  const items = (body.items || []).map((item) => {
    const producto = opticaInventario.find((p) => p.id === item.productoId);

    if (producto) {
      producto.stockAvailable = Math.max(0, producto.stockAvailable - Number(item.cantidad));
    }

    return {
      producto_id: item.productoId,
      codigo: producto?.code ?? "",
      modelo: producto?.model ?? "",
      cantidad: Number(item.cantidad),
      precio_unitario: Number(item.precioUnitario),
      subtotal: Number(item.cantidad) * Number(item.precioUnitario),
    };
  });

  const subtotal = body.subtotal ?? items.reduce((sum, item) => sum + item.subtotal, 0);
  const iva = body.iva ?? 0;
  const total = body.total ?? subtotal + iva;

  const venta = {
    id: newId(),
    sucursal_id: body.sucursalId,
    paciente_id: body.pacienteId || null,
    metodo_pago: body.metodoPago,
    estado: "completada",
    creado_por: "mock-user",
    created_at: new Date().toISOString(),
    items,
    subtotal,
    iva,
    total,
    monto_pagado: body.montoPagado ?? total,
    saldo_pendiente: body.saldoPendiente ?? 0,
  };

  opticaVentas.unshift(venta);
  res.status(201).json({ ok: true, venta });
});

app.patch("/api/opticas/ventas/:id/cancelar", (req, res) => {
  const idx = opticaVentas.findIndex((v) => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Venta no encontrada" });

  const venta = opticaVentas[idx];

  venta.items.forEach((item) => {
    const producto = opticaInventario.find((p) => p.id === item.producto_id);
    if (producto) {
      producto.stockAvailable += item.cantidad;
    }
  });

  opticaVentas[idx] = { ...venta, estado: "cancelada" };
  res.json({ ok: true, venta: opticaVentas[idx] });
});

let opticaLaboratorio = [
  {
    id: "olab-1", sucursal_id: "osuc-1", paciente_id: null, venta_id: "oven-2",
    items: [{ producto_id: "oinv-3", codigo: "MIC-OPT-001", modelo: "Antireflejante Plus" }],
    receta: { od_esfera: "-1.50", od_cilindro: "-0.50", od_eje: "90", oi_esfera: "-1.25", oi_cilindro: "-0.25", oi_eje: "85", adicion: "", dp: "62" },
    observaciones: "Cliente pidió entrega antes del viernes.",
    estado: "en_proceso", creado_por: "u-oemp-1", created_at: daysFromNow(0),
  },
  {
    id: "olab-2", sucursal_id: "osuc-1", paciente_id: "opac-1", venta_id: "oven-1",
    items: [{ producto_id: "oinv-1", codigo: "OPT-001", modelo: "Redonda Slim" }],
    receta: { od_esfera: "-2.00", od_cilindro: "0.00", od_eje: "0", oi_esfera: "-2.25", oi_cilindro: "0.00", oi_eje: "0", adicion: "+1.00", dp: "60" },
    observaciones: "",
    estado: "pendiente", creado_por: "u-oenc-1", created_at: daysFromNow(-1),
  },
  {
    id: "olab-3", sucursal_id: "osuc-1", paciente_id: "opac-2", venta_id: "oven-3",
    items: [{ producto_id: "oinv-1", codigo: "OPT-001", modelo: "Redonda Slim" }],
    receta: { od_esfera: "-0.75", od_cilindro: "-0.25", od_eje: "180", oi_esfera: "-0.75", oi_cilindro: "0.00", oi_eje: "0", adicion: "", dp: "61" },
    observaciones: "",
    estado: "listo", creado_por: "u-oenc-1", created_at: daysFromNow(-4),
  },
];

// Contrato propuesto para laboratorio (modulo nuevo, sin nada en el back
// real): respuestas { ok, orden } / { ok, ordenes }, con ?sucursalId= en
// el listado igual que pacientes/citas/ventas. Cada orden nace ligada a
// una venta (venta_id) desde el flujo de Ventas.

app.get("/api/opticas/laboratorio", (req, res) => {
  const { sucursalId } = req.query;
  const ordenes = opticaLaboratorio.filter((o) => o.sucursal_id === sucursalId);
  res.json({ ok: true, ordenes });
});

app.get("/api/opticas/laboratorio/:id", (req, res) => {
  const orden = opticaLaboratorio.find((o) => o.id === req.params.id);
  if (!orden) return res.status(404).json({ error: "Orden no encontrada" });
  res.json({ ok: true, orden });
});

app.post("/api/opticas/laboratorio", (req, res) => {
  const body = req.body;
  const orden = {
    id: newId(),
    sucursal_id: body.sucursalId,
    paciente_id: body.pacienteId || null,
    venta_id: body.ventaId || null,
    items: (body.items || []).map((item) => ({
      producto_id: item.productoId,
      codigo: item.codigo,
      modelo: item.modelo,
    })),
    receta: {
      od_esfera: body.receta?.odEsfera || null,
      od_cilindro: body.receta?.odCilindro || null,
      od_eje: body.receta?.odEje || null,
      oi_esfera: body.receta?.oiEsfera || null,
      oi_cilindro: body.receta?.oiCilindro || null,
      oi_eje: body.receta?.oiEje || null,
      adicion: body.receta?.adicion || null,
      dp: body.receta?.dp || null,
    },
    observaciones: body.observaciones || null,
    estado: "pendiente",
    creado_por: "mock-user",
    created_at: new Date().toISOString(),
  };
  opticaLaboratorio.unshift(orden);
  res.status(201).json({ ok: true, orden });
});

app.patch("/api/opticas/laboratorio/:id/estado", (req, res) => {
  const idx = opticaLaboratorio.findIndex((o) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Orden no encontrada" });
  opticaLaboratorio[idx] = { ...opticaLaboratorio[idx], estado: req.body.estado };
  res.json({ ok: true, orden: opticaLaboratorio[idx] });
});

// ---- Optica (informacion general de la empresa) ----

let opticaInfo = {
  logo_url: "",
  nombre_comercial: "Óptica Vision",
  razon_social: "Óptica Vision S.A. de C.V.",
  rfc: "OVI010101ABC",
  responsable_sanitario: "Dra. Marta Sánchez",
  telefono: "9611234567",
  correo: "contacto@opticavision.mx",
  sitio_web: "www.opticavision.mx",
  calle: "Av. Central",
  numero_exterior: "123",
  numero_interior: "",
  colonia: "Centro",
  codigo_postal: "30700",
  municipio: "Tapachula",
  estado_direccion: "Chiapas",
  pais: "México",
  moneda: "MXN",
  regimen_fiscal: "general_personas_morales",
  impuesto_predeterminado: "16",
  folio_inicial_ventas: "000001",
  serie_documentos: "VTA",
  texto_documentos: "Gracias por su compra.",
  color_principal: "#1E3AAB",
  color_secundario: "#60DAFA",
  eslogan: "Cuidando tu visión desde 1998",
  pie_documentos: "Gracias por su preferencia.",
};

app.get("/api/opticas/informacion", (req, res) => {
  res.json({ ok: true, info: opticaInfo });
});

app.put("/api/opticas/informacion", (req, res) => {
  const body = req.body;
  opticaInfo = {
    logo_url: body.logoUrl ?? "",
    nombre_comercial: body.nombreComercial,
    razon_social: body.razonSocial,
    rfc: body.rfc,
    responsable_sanitario: body.responsableSanitario,
    telefono: body.telefono,
    correo: body.correo,
    sitio_web: body.sitioWeb,
    calle: body.calle,
    numero_exterior: body.numeroExterior,
    numero_interior: body.numeroInterior,
    colonia: body.colonia,
    codigo_postal: body.codigoPostal,
    municipio: body.municipio,
    estado_direccion: body.estadoDireccion,
    pais: body.pais,
    moneda: body.moneda,
    regimen_fiscal: body.regimenFiscal,
    impuesto_predeterminado: body.impuestoPredeterminado,
    folio_inicial_ventas: body.folioInicialVentas,
    serie_documentos: body.serieDocumentos,
    texto_documentos: body.textoDocumentos,
    color_principal: body.colorPrincipal,
    color_secundario: body.colorSecundario,
    eslogan: body.eslogan,
    pie_documentos: body.pieDocumentos,
  };
  res.json({ ok: true, info: opticaInfo });
});

// ---- Productos y servicios (catalogo, no depende de sucursal) ----

let opticaProductos = [
  { id: "oprod-1", display_id: 1, codigo: "ARM-CAT-001", codigo_barras: "", nombre: "Armazón Clásico", categoria: "armazones", marca: "OKI Eyewear", descripcion: "Armazón de acetato clásico.", precio_venta: 890, costo: 450, impuesto: 16, unidad_medida: "pieza", active: true },
  { id: "oprod-2", display_id: 2, codigo: "MIC-CAT-001", codigo_barras: "", nombre: "Mica Antireflejante", categoria: "lentes_oftalmicos", marca: "Resistant Flex", descripcion: "Mica con tratamiento antirreflejante.", precio_venta: 650, costo: 320, impuesto: 16, unidad_medida: "pieza", active: true },
  { id: "oprod-3", display_id: 3, codigo: "SOL-CAT-001", codigo_barras: "", nombre: "Solución multipropósito", categoria: "soluciones", marca: "OptiCare", descripcion: "Solución para lentes de contacto 355ml.", precio_venta: 180, costo: 90, impuesto: 16, unidad_medida: "pieza", active: true },
];

let opticaServicios = [
  { id: "oserv-1", display_id: 1, codigo: "SRV-001", nombre: "Examen de la vista", categoria: "consultas", descripcion: "Evaluación completa de agudeza visual.", precio: 300, impuesto: 16, duracion_estimada: 30, active: true },
  { id: "oserv-2", display_id: 2, codigo: "SRV-002", nombre: "Ajuste de armazón", categoria: "ajustes", descripcion: "Ajuste y calibración de armazón.", precio: 0, impuesto: 0, duracion_estimada: 10, active: true },
  { id: "oserv-3", display_id: 3, codigo: "SRV-003", nombre: "Reparación de armazón", categoria: "reparaciones", descripcion: "Reparación de bisagra o varilla.", precio: 150, impuesto: 16, duracion_estimada: 20, active: true },
];

registrarCrud("/api/opticas/productos", () => opticaProductos, {
  crear: (body) => ({
    id: newId(), display_id: opticaProductos.length + 1,
    codigo: body.codigo, codigo_barras: body.codigo_barras || "", nombre: body.nombre,
    categoria: body.categoria, marca: body.marca, descripcion: body.descripcion || "",
    precio_venta: Number(body.precio_venta), costo: Number(body.costo),
    impuesto: Number(body.impuesto) || 0, unidad_medida: body.unidad_medida || "pieza",
    active: true,
  }),
  actualizar: (body) => ({
    codigo: body.codigo, codigo_barras: body.codigo_barras || "", nombre: body.nombre,
    categoria: body.categoria, marca: body.marca, descripcion: body.descripcion || "",
    precio_venta: Number(body.precio_venta), costo: Number(body.costo),
    impuesto: Number(body.impuesto) || 0, unidad_medida: body.unidad_medida || "pieza",
  }),
});

registrarCrud("/api/opticas/servicios", () => opticaServicios, {
  crear: (body) => ({
    id: newId(), display_id: opticaServicios.length + 1,
    codigo: body.codigo, nombre: body.nombre, categoria: body.categoria,
    descripcion: body.descripcion || "", precio: Number(body.precio),
    impuesto: Number(body.impuesto) || 0, duracion_estimada: Number(body.duracion_estimada) || 0,
    active: true,
  }),
  actualizar: (body) => ({
    codigo: body.codigo, nombre: body.nombre, categoria: body.categoria,
    descripcion: body.descripcion || "", precio: Number(body.precio),
    impuesto: Number(body.impuesto) || 0, duracion_estimada: Number(body.duracion_estimada) || 0,
  }),
});

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`Mock backend corriendo en http://localhost:${PORT}`);
});
