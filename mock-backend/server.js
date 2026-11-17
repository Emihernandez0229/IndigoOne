const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// El back real envuelve toda respuesta exitosa en {success, data} y
// httpClient.js del front solo desenvuelve si encuentra esa clave "data"
// exacta. El mock histórico mezcla tres formas: ya corregidas a {success,
// data} (citas), con su propio sobre viejo {ok, pacientes}/{ok, venta}/etc,
// o el objeto tal cual sin sobre - sin normalizar esto, el front recibía
// el sobre viejo completo donde esperaba el arreglo/objeto de adentro y
// tronaba. Se normaliza aquí una sola vez en vez de tocar cada ruta vieja.
function desenvolverSobreViejo(body) {
  if (!body || typeof body !== "object" || !("ok" in body)) return body;
  const otrasClaves = Object.keys(body).filter((k) => k !== "ok");
  if (otrasClaves.length === 0) return body.ok;
  if (otrasClaves.length === 1) return body[otrasClaves[0]];
  return body; // forma inesperada con mas de una clave extra - no tocar
}

app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const limpio = desenvolverSobreViejo(body);
    // El back real a veces manda {success, data} y a veces {message, data}
    // (ej. altas de usuarios) - cualquiera de las dos ya trae la clave
    // "data" que httpClient.js busca, así que ambas cuentan como "ya en
    // formato nuevo" y no se deben volver a envolver.
    const yaEnvuelto = limpio && typeof limpio === "object" && ("success" in limpio || "data" in limpio);
    if (res.statusCode >= 200 && res.statusCode < 300 && !yaEnvuelto) {
      return originalJson({ success: true, data: limpio });
    }
    return originalJson(limpio);
  };
  next();
});

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

// "Mi perfil" (todos los roles, Indigo y Ópticas): cambio de contraseña -
// el back real no pide la contraseña actual, solo la nueva (ver
// login.service.js, POST /api/auth/login/cambiar-password). El mock no
// guarda contraseñas reales, así que solo se simula el éxito.
app.post("/api/auth/login/cambiar-password", (req, res) => {
  const { passwordNueva } = req.body;
  if (!passwordNueva || passwordNueva.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }
  res.json({ mensaje: "Contraseña actualizada correctamente" });
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

// Datos que necesita "Mi perfil" (todos los roles) y que los 13 usuarios de
// arriba no traian: correo, fecha de ingreso y contacto de emergencia.
indigoUsuarios = indigoUsuarios.map((u, index) => ({
  email: `${u.username.toLowerCase()}@indigo.mx`,
  createdAt: new Date(2025, 3, 10 + (index % 15)).toISOString(),
  emergencyContact: { name: "", phone: "", relation: "" },
  ...u,
}));

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
// Precio base por tipo de servicio (pesos por pieza), usado para estimar el
// monto de venta de cada trabajo - el modulo de Laboratorio no cobra, pero
// el Dashboard de Gerente de sucursal necesita una cifra de "ventas" por
// periodo y esta es la unica fuente de datos real que hay por sucursal.
const SERVICE_PRICES = { bisel: 350, montaje: 450, tinte: 300, otro: 400 };
indigoLaboratorio = indigoLaboratorio.map((job) => ({
  registeredBy: job.seller,
  registeredById: SELLER_IDS[job.seller] || null,
  requestedDeliveryAt: new Date(new Date(job.entryAt).getTime() + 2 * 86400000).toISOString(),
  amount: (SERVICE_PRICES[job.serviceType] || 350) * (job.quantity || 1),
  ...job,
  // "Añadir detalles" (Empleado de Laboratorio) necesita texto + quien lo
  // escribio + cuando, no solo el texto plano que tenian estos 15 iniciales.
  workItems: (job.workItems || []).map((item) =>
    typeof item === "string" ? { text: item, author: job.labPerson || null, at: job.entryAt } : item
  ),
}));

// Datos de preview para el Dashboard de Dueño: 7 sucursales extra (10 en
// total con las 3 de arriba) con trabajos de laboratorio variados, para ver
// como se ve la grafica "Estado de trabajos por sucursal" con mas barras.
// Solo son datos de muestra (sin usuarios/clientes propios), no afectan el
// resto de los modulos.
function daysAgo(n, hour) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const PREVIEW_BRANCHES = [
  { id: "suc-4", name: "Indigo Oaxaca", state: "Oaxaca", municipality: "Oaxaca de Juárez", seller: "Ana", labPerson: "Raúl", total: 9 },
  { id: "suc-5", name: "Indigo Puebla", state: "Puebla", municipality: "Puebla", seller: "Iván", labPerson: "Dulce", total: 8 },
  { id: "suc-6", name: "Indigo Guadalajara", state: "Jalisco", municipality: "Guadalajara", seller: "Marco", labPerson: "Fernanda", total: 7 },
  { id: "suc-7", name: "Indigo Mérida", state: "Yucatán", municipality: "Mérida", seller: "Lupita", labPerson: "Toño", total: 6 },
  { id: "suc-8", name: "Indigo Querétaro", state: "Querétaro", municipality: "Querétaro", seller: "Hugo", labPerson: "Nadia", total: 5 },
  { id: "suc-9", name: "Indigo Tijuana", state: "Baja California", municipality: "Tijuana", seller: "Brenda", labPerson: "Kevin", total: 4 },
  { id: "suc-10", name: "Indigo Cancún", state: "Quintana Roo", municipality: "Cancún", seller: "Rodrigo", labPerson: "Paola", total: 3 },
];

indigoSucursales.push(
  ...PREVIEW_BRANCHES.map((b, i) => ({
    id: b.id, displayId: 4 + i, name: b.name,
    image: "", address: "", phone: "",
    country: "México", state: b.state, municipality: b.municipality,
    manager: null, managerId: null, managerPhone: "",
    subManager: null, subManagerId: null, subManagerPhone: "",
    staff: 0, products: 0, customers: 0, labJobs: b.total, status: "active",
    staffList: [],
  }))
);

PREVIEW_BRANCHES.forEach((branch, branchIndex) => {
  const jobs = [];

  // Pendientes/en proceso: siempre cuentan como "ahora", sin importar fecha.
  jobs.push({ status: "pending", daysAgo: 0 });
  if (branch.total >= 4) jobs.push({ status: "processing", daysAgo: 0 });
  // Mermas: una muestra reciente (esta semana) para que el filtro de
  // periodo se note al cambiar entre Hoy/Semana/Mes.
  if (branch.total >= 6) jobs.push({ status: "loss", daysAgo: 3 });

  // El resto son "terminados", repartidos entre hoy / esta semana / este
  // mes para que los 3 botones de periodo muestren totales distintos.
  const completedOffsets = [0, 1, 4, 9, 15, 22, 27];
  while (jobs.length < branch.total) {
    jobs.push({ status: "completed", daysAgo: completedOffsets[(jobs.length * 3) % completedOffsets.length] });
  }

  const SERVICE_TYPES_CYCLE = ["bisel", "montaje", "tinte", "otro"];

  jobs.forEach((job, jobIndex) => {
    const entryAt = daysAgo(job.daysAgo + 1, 9);
    const isPending = job.status === "pending";
    const serviceType = SERVICE_TYPES_CYCLE[jobIndex % SERVICE_TYPES_CYCLE.length];

    indigoLaboratorio.push({
      id: `lab-prev-${branch.id}-${jobIndex}`,
      displayId: 1000 + branchIndex * 20 + jobIndex,
      folio: `LAB-0009${branchIndex}${jobIndex}`,
      branchId: branch.id, branchName: branch.name,
      clientName: "Cliente de muestra", seller: branch.seller, serviceType, biselType: "Automático",
      quantity: 1, urgent: false,
      amount: SERVICE_PRICES[serviceType],
      labPerson: branch.labPerson, acceptedBy: isPending ? null : branch.labPerson,
      status: job.status,
      entryAt,
      acceptedAt: isPending ? null : daysAgo(job.daysAgo + 1, 9.25),
      processingAt: isPending ? null : daysAgo(job.daysAgo + 1, 9.5),
      completedAt: job.status === "completed" ? daysAgo(job.daysAgo, 13) : null,
      deliveredAt: null,
      lossAt: job.status === "loss" ? daysAgo(job.daysAgo, 13) : null,
      lossReason: job.status === "loss" ? "Defecto detectado durante el proceso de bisel." : null,
      workItems: [],
      registeredBy: branch.seller, registeredById: null,
      requestedDeliveryAt: daysAgo(Math.max(job.daysAgo - 2, 0), 17),
    });
  });
});

// Mas personal de Ventas y Laboratorio en las 3 sucursales reales (para que
// el Dashboard de Gerente/Subgerente - "Comparacion de mermas por
// laboratorista" y "Actividad del equipo" - tenga varias personas con
// rendimientos distintos, no solo 1 vendedor/1 laboratorista por sucursal.
const STAFF_SEEDS = [
  {
    branchId: "suc-1", branchName: "Indigo Tapachula",
    sellers: ["Diana", "Héctor", "Paola", "Iván"],
    lab: [
      { name: "Oscar", completed: 35, merma: 1 },
      { name: "Valeria", completed: 20, merma: 4 },
      { name: "Gael", completed: 28, merma: 2 },
      { name: "Fabiola", completed: 15, merma: 0 },
    ],
  },
  {
    branchId: "suc-2", branchName: "Indigo CDMX",
    sellers: ["Luis", "Andrea", "Tomás", "Ximena"],
    lab: [
      { name: "Dulce", completed: 30, merma: 2 },
      { name: "Raúl", completed: 18, merma: 5 },
      { name: "Cielo", completed: 24, merma: 1 },
      { name: "Beto", completed: 12, merma: 1 },
    ],
  },
  {
    branchId: "suc-3", branchName: "Indigo Monterrey",
    sellers: ["Karla", "Emilio", "Noemí", "Saúl"],
    lab: [
      { name: "Vero", completed: 26, merma: 1 },
      { name: "Iker", completed: 19, merma: 3 },
      { name: "Mayra", completed: 22, merma: 2 },
      { name: "Checo", completed: 14, merma: 0 },
    ],
  },
];

let staffCounter = 0;
STAFF_SEEDS.forEach((branch) => {
  const sellerUsers = branch.sellers.map((name) => {
    staffCounter += 1;
    const id = `u-vta-x${staffCounter}`;
    indigoUsuarios.push({
      id, displayId: 1000 + staffCounter, name,
      username: `VTA${1000 + staffCounter}`, role: "indigo:empleado_ventas",
      branchId: branch.branchId, branchName: branch.branchName, status: "active", phone: "",
    });
    return { id, name };
  });

  let sellerCursor = 0;
  const nextSeller = () => {
    const s = sellerUsers[sellerCursor % sellerUsers.length];
    sellerCursor += 1;
    return s;
  };

  branch.lab.forEach((person) => {
    staffCounter += 1;
    const labId = `u-lab-x${staffCounter}`;
    indigoUsuarios.push({
      id: labId, displayId: 1000 + staffCounter, name: person.name,
      username: `LAB${1000 + staffCounter}`, role: "indigo:empleado_laboratorio",
      branchId: branch.branchId, branchName: branch.branchName, status: "active", phone: "",
    });

    for (let i = 0; i < person.completed; i++) {
      const daysOffset = i % 45;
      const seller = nextSeller();
      indigoLaboratorio.push({
        id: `lab-staff-${labId}-c${i}`,
        displayId: 3000 + staffCounter * 100 + i,
        folio: `LAB-S${staffCounter}C${i}`,
        branchId: branch.branchId, branchName: branch.branchName,
        clientName: "Cliente de muestra", seller: seller.name, serviceType: "bisel", biselType: "Automático",
        quantity: 1, urgent: false,
        labPerson: person.name, acceptedBy: person.name, status: "completed",
        entryAt: daysAgo(daysOffset + 1, 9),
        acceptedAt: daysAgo(daysOffset + 1, 9),
        processingAt: daysAgo(daysOffset + 1, 9),
        completedAt: daysAgo(daysOffset, 13),
        deliveredAt: null, lossAt: null, lossReason: null, workItems: [],
        registeredBy: seller.name, registeredById: seller.id,
        requestedDeliveryAt: daysAgo(Math.max(daysOffset - 2, 0), 17),
        amount: 350,
      });
    }

    for (let i = 0; i < person.merma; i++) {
      const daysOffset = (i * 9 + 3) % 45;
      const seller = nextSeller();
      indigoLaboratorio.push({
        id: `lab-staff-${labId}-m${i}`,
        displayId: 3000 + staffCounter * 100 + 50 + i,
        folio: `LAB-S${staffCounter}M${i}`,
        branchId: branch.branchId, branchName: branch.branchName,
        clientName: "Cliente de muestra", seller: seller.name, serviceType: "bisel", biselType: "Automático",
        quantity: 1, urgent: false,
        labPerson: person.name, acceptedBy: person.name, status: "loss",
        entryAt: daysAgo(daysOffset + 1, 9),
        acceptedAt: daysAgo(daysOffset + 1, 9),
        processingAt: daysAgo(daysOffset + 1, 9),
        completedAt: null,
        deliveredAt: null,
        lossAt: daysAgo(daysOffset, 13),
        lossReason: "Defecto detectado durante el proceso de bisel.",
        workItems: [],
        registeredBy: seller.name, registeredById: seller.id,
        requestedDeliveryAt: daysAgo(Math.max(daysOffset - 2, 0), 17),
        amount: 350,
      });
    }
  });
});

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
  { id: "inv-1", displayId: 1, code: "ARM-001", model: "Aviador Classic", description: "Armazón metálico estilo aviador, clásico y ligero.", color: "Dorado", type: "armazones", material: "OKI Eyewear", shape: "Aviador", frameMaterial: "Metal", lensCompatibility: ["Monofocal", "Progresiva"], gender: "hombre", measurements: "56-17-140", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 48, stockReserved: 6, stockMin: 10, cost: 450, active: true, photos: [
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23c9a15a'/%3E%3Ctext x='50%25' y='50%25' fill='white' font-size='20' text-anchor='middle'%3EFoto 1%3C/text%3E%3C/svg%3E",
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23334155'/%3E%3Ctext x='50%25' y='50%25' fill='white' font-size='20' text-anchor='middle'%3EFoto 2%3C/text%3E%3C/svg%3E",
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%234f46e5'/%3E%3Ctext x='50%25' y='50%25' fill='white' font-size='20' text-anchor='middle'%3EFoto 3%3C/text%3E%3C/svg%3E"
  ] },
  { id: "inv-1b", displayId: 2, code: "ARM-001", model: "Aviador Classic", description: "Armazón metálico estilo aviador, clásico y ligero.", color: "Dorado", type: "armazones", material: "OKI Eyewear", shape: "Aviador", frameMaterial: "Metal", lensCompatibility: ["Monofocal", "Progresiva"], gender: "hombre", measurements: "56-17-140", branchId: "suc-2", branchName: "Indigo CDMX", stockAvailable: 22, stockReserved: 2, stockMin: 10, cost: 450, active: true, photos: [] },
  { id: "inv-1c", displayId: 3, code: "ARM-001", model: "Aviador Classic", description: "Armazón metálico estilo aviador, clásico y ligero.", color: "Dorado", type: "armazones", material: "OKI Eyewear", shape: "Aviador", frameMaterial: "Metal", lensCompatibility: ["Monofocal", "Progresiva"], gender: "hombre", measurements: "56-17-140", branchId: "suc-3", branchName: "Indigo Monterrey", stockAvailable: 8, stockReserved: 0, stockMin: 10, cost: 450, active: true, photos: [] },
  { id: "inv-2", displayId: 4, code: "ARM-002", model: "Wayfarer Mini", description: "Armazón de acetato compacto, ideal para rostros pequeños.", color: "Negro", type: "armazones", material: "JD Sport", shape: "Wayfarer", frameMaterial: "Acetato", lensCompatibility: ["Monofocal"], gender: "unisex", measurements: "50-19-135", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 3, stockReserved: 1, stockMin: 5, cost: 380, active: true, photos: [] },
  { id: "inv-3", displayId: 5, code: "ARM-003", model: "Round Vintage", description: "Armazón redondo de inspiración vintage.", color: "Carey", type: "armazones", material: "Cactus", shape: "Redondo", frameMaterial: "Acetato", lensCompatibility: ["Monofocal", "Progresiva"], gender: "mujer", measurements: "48-20-140", branchId: "suc-2", branchName: "Indigo CDMX", stockAvailable: 0, stockReserved: 0, stockMin: 4, cost: 500, active: true, photos: [] },
  { id: "inv-4", displayId: 6, code: "MIC-001", model: "Progresiva HD", description: "Visión de lejos, intermedia y de cerca sin línea visible.", color: "Transparente", type: "micas", material: "Progresivos Superfit", gender: "unisex", measurements: "70mm", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 14, stockReserved: 4, stockMin: 8, cost: 900, active: true, photos: [] },
  { id: "inv-4b", displayId: 15, code: "MIC-002", model: "Monofocal", description: "Un solo campo de visión, para lejos o para cerca.", color: "Transparente", type: "micas", material: "Photoflux", gender: "unisex", measurements: "70mm", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 30, stockReserved: 0, stockMin: 5, cost: 250, active: true, photos: [] },
  { id: "inv-4c", displayId: 16, code: "MIC-003", model: "Bifocal", description: "Dos campos de visión, con segmento visible.", color: "Transparente", type: "micas", material: "Resistant Flex", gender: "unisex", measurements: "70mm", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 20, stockReserved: 0, stockMin: 5, cost: 400, active: true, photos: [] },
  { id: "inv-5", displayId: 7, code: "ACC-001", model: "Cordón para lentes ajustable", description: "Cordón ajustable para sujetar lentes.", color: "Negro", type: "accesorios", material: "Nylon", gender: "unisex", measurements: "70cm", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 120, stockReserved: 10, stockMin: 20, cost: 35, active: true, photos: [] },
  { id: "inv-5b", displayId: 8, code: "ACC-001", model: "Cordón para lentes ajustable", description: "Cordón ajustable para sujetar lentes.", color: "Negro", type: "accesorios", material: "Nylon", gender: "unisex", measurements: "70cm", branchId: "suc-2", branchName: "Indigo CDMX", stockAvailable: 95, stockReserved: 5, stockMin: 20, cost: 35, active: true, photos: [] },
  { id: "inv-6", displayId: 9, code: "ACC-002", model: "Paño de microfibra", description: "Paño de microfibra para limpieza de lentes.", color: "Azul", type: "accesorios", material: "Microfibra", gender: "unisex", measurements: "15x15 cm", branchId: "suc-3", branchName: "Indigo Monterrey", stockAvailable: 260, stockReserved: 0, stockMin: 30, cost: 18, active: true, photos: [] },
  { id: "inv-7", displayId: 10, code: "EST-001", model: "Estuche rígido con cierre", description: "Estuche rígido con cierre para armazones.", color: "Negro", type: "estuches", material: "EVA", gender: "unisex", measurements: "16x6x5 cm", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 85, stockReserved: 8, stockMin: 15, cost: 60, active: true, photos: [] },
  { id: "inv-7b", displayId: 11, code: "EST-001", model: "Estuche rígido con cierre", description: "Estuche rígido con cierre para armazones.", color: "Negro", type: "estuches", material: "EVA", gender: "unisex", measurements: "16x6x5 cm", branchId: "suc-2", branchName: "Indigo CDMX", stockAvailable: 40, stockReserved: 2, stockMin: 15, cost: 60, active: true, photos: [] },
  { id: "inv-8", displayId: 12, code: "OTR-001", model: "Kit de destornilladores para lentes", description: "Kit de mini destornilladores para ajuste de armazones.", color: "Gris", type: "otros", material: "Metal", gender: "unisex", measurements: "N/A", branchId: "suc-2", branchName: "Indigo CDMX", stockAvailable: 18, stockReserved: 0, stockMin: 5, cost: 45, active: true, photos: [] },
  { id: "inv-9", displayId: 13, code: "ARM-004", model: "Armazón al aire titanio", description: "Armazón al aire de titanio, ultraligero.", color: "Plata", type: "armazones", material: "Friend", shape: "Al aire", frameMaterial: "Titanio", lensCompatibility: ["Monofocal", "Progresiva", "Bifocal"], gender: "hombre", measurements: "54-18-140", branchId: "suc-2", branchName: "Indigo CDMX", stockAvailable: 0, stockReserved: 0, stockMin: 6, cost: 1150, active: true, photos: [] },
  { id: "inv-10", displayId: 14, code: "ARM-005", model: "Armazón infantil flexible", description: "Armazón flexible resistente para niños.", color: "Azul", type: "armazones", material: "Toki Kids", shape: "Rectangular", frameMaterial: "TR90", lensCompatibility: ["Monofocal"], gender: "unisex", measurements: "44-16-125", branchId: "suc-3", branchName: "Indigo Monterrey", stockAvailable: 6, stockReserved: 1, stockMin: 8, cost: 420, active: true, photos: [] },

  // --- 20 productos extra para probar el catálogo con más volumen ---
  { id: "inv-11", displayId: 17, code: "ARM-006", model: "Clubmaster Retro", description: "Armazón estilo clubmaster con ceja marcada.", color: "Carey", type: "armazones", material: "Eclipse", shape: "Clubmaster", frameMaterial: "Acetato", lensCompatibility: ["Monofocal", "Progresiva"], gender: "hombre", measurements: "52-18-145", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 15, stockReserved: 2, stockMin: 6, cost: 410, active: true, photos: [] },
  { id: "inv-12", displayId: 18, code: "ARM-007", model: "Cat Eye Elegance", description: "Armazón cat eye con detalles metálicos.", color: "Rosa", type: "armazones", material: "Mar", shape: "Cat eye", frameMaterial: "Acetato", lensCompatibility: ["Monofocal"], gender: "mujer", measurements: "53-16-140", branchId: "suc-2", branchName: "Indigo CDMX", stockAvailable: 9, stockReserved: 1, stockMin: 5, cost: 530, active: true, photos: [] },
  { id: "inv-13", displayId: 19, code: "ARM-008", model: "Square Bold", description: "Armazón cuadrado de pasta gruesa.", color: "Negro mate", type: "armazones", material: "Fashion", shape: "Cuadrado", frameMaterial: "Acetato", lensCompatibility: ["Monofocal", "Progresiva"], gender: "unisex", measurements: "54-19-145", branchId: "suc-3", branchName: "Indigo Monterrey", stockAvailable: 2, stockReserved: 0, stockMin: 5, cost: 390, active: true, photos: [] },
  { id: "inv-14", displayId: 20, code: "ARM-009", model: "Oversized Chic", description: "Armazón oversized de moda.", color: "Habano", type: "armazones", material: "Life", shape: "Oversized", frameMaterial: "Acetato", lensCompatibility: ["Monofocal"], gender: "mujer", measurements: "56-17-145", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 0, stockReserved: 0, stockMin: 4, cost: 470, active: true, photos: [] },
  { id: "inv-15", displayId: 21, code: "ARM-010", model: "Sport Flex", description: "Armazón deportivo flexible resistente a impactos.", color: "Azul marino", type: "armazones", material: "JM", shape: "Deportivo", frameMaterial: "TR90", lensCompatibility: ["Monofocal", "Progresiva"], gender: "hombre", measurements: "55-18-140", branchId: "suc-2", branchName: "Indigo CDMX", stockAvailable: 20, stockReserved: 3, stockMin: 8, cost: 360, active: true, photos: [] },
  { id: "inv-16", displayId: 22, code: "ARM-011", model: "Vintage Panto", description: "Armazón panto de inspiración vintage.", color: "Dorado", type: "armazones", material: "OKI Eyewear", shape: "Panto", frameMaterial: "Metal", lensCompatibility: ["Monofocal", "Progresiva"], gender: "unisex", measurements: "49-21-140", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 5, stockReserved: 0, stockMin: 6, cost: 480, active: true, photos: [] },
  { id: "inv-17", displayId: 23, code: "ARM-012", model: "Browline Classic", description: "Armazón browline café con dorado.", color: "Café", type: "armazones", material: "Cactus", shape: "Browline", frameMaterial: "Metal", lensCompatibility: ["Monofocal"], gender: "hombre", measurements: "51-20-145", branchId: "suc-3", branchName: "Indigo Monterrey", stockAvailable: 11, stockReserved: 1, stockMin: 5, cost: 420, active: true, photos: [] },
  { id: "inv-18", displayId: 24, code: "ARM-013", model: "Kids Round", description: "Armazón redondo infantil, ligero y resistente.", color: "Verde", type: "armazones", material: "Toki Kids", shape: "Redondo", frameMaterial: "TR90", lensCompatibility: ["Monofocal"], gender: "unisex", measurements: "46-17-125", branchId: "suc-2", branchName: "Indigo CDMX", stockAvailable: 18, stockReserved: 2, stockMin: 8, cost: 300, active: true, photos: [] },
  { id: "inv-19", displayId: 25, code: "ARM-014", model: "Titanium Light", description: "Armazón de titanio ultraligero para uso diario.", color: "Gris", type: "armazones", material: "Friend", shape: "Rectangular", frameMaterial: "Titanio", lensCompatibility: ["Monofocal", "Progresiva", "Bifocal"], gender: "hombre", measurements: "55-17-140", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 3, stockReserved: 0, stockMin: 5, cost: 980, active: true, photos: [] },
  { id: "inv-20", displayId: 26, code: "ARM-015", model: "Minimal Rimless", description: "Armazón al aire minimalista.", color: "Plata", type: "armazones", material: "Eclipse", shape: "Al aire", frameMaterial: "Titanio", lensCompatibility: ["Monofocal", "Progresiva"], gender: "unisex", measurements: "54-18-140", branchId: "suc-3", branchName: "Indigo Monterrey", stockAvailable: 7, stockReserved: 0, stockMin: 6, cost: 650, active: true, photos: [] },

  { id: "inv-21", displayId: 27, code: "MIC-004", model: "Ocupacional", description: "Mica de uso ocupacional, enfocada a distancia intermedia.", color: "Transparente", type: "micas", material: "Photoflux", gender: "unisex", measurements: "70mm", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 25, stockReserved: 0, stockMin: 8, cost: 350, active: true, photos: [] },
  { id: "inv-22", displayId: 28, code: "MIC-005", model: "Polarizada", description: "Mica polarizada, reduce el reflejo de luz intensa.", color: "Gris", type: "micas", material: "Resistant Flex", gender: "unisex", measurements: "70mm", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 15, stockReserved: 0, stockMin: 5, cost: 600, active: true, photos: [] },
  { id: "inv-23", displayId: 29, code: "MIC-006", model: "Fotocromática", description: "Mica que se oscurece automáticamente con la luz solar.", color: "Transparente", type: "micas", material: "Antibue Premium", gender: "unisex", measurements: "70mm", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 10, stockReserved: 0, stockMin: 5, cost: 750, active: true, photos: [] },

  { id: "inv-24", displayId: 30, code: "ACC-003", model: "Spray limpiador de lentes", description: "Spray antiempañante y limpiador para lentes.", color: "Transparente", type: "accesorios", material: "Antiempañante", gender: "unisex", measurements: "60ml", branchId: "suc-2", branchName: "Indigo CDMX", stockAvailable: 150, stockReserved: 10, stockMin: 30, cost: 55, active: true, photos: [] },
  { id: "inv-25", displayId: 31, code: "ACC-004", model: "Cadena para lentes", description: "Cadena decorativa para sujetar lentes.", color: "Dorado", type: "accesorios", material: "Metal", gender: "unisex", measurements: "75cm", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 60, stockReserved: 5, stockMin: 15, cost: 90, active: true, photos: [] },
  { id: "inv-26", displayId: 32, code: "ACC-005", model: "Funda de microfibra", description: "Funda suave de microfibra para transportar lentes.", color: "Gris", type: "accesorios", material: "Microfibra", gender: "unisex", measurements: "17x8 cm", branchId: "suc-3", branchName: "Indigo Monterrey", stockAvailable: 80, stockReserved: 0, stockMin: 20, cost: 25, active: true, photos: [] },

  { id: "inv-27", displayId: 33, code: "EST-002", model: "Estuche semirrígido", description: "Estuche semirrígido con broche magnético.", color: "Café", type: "estuches", material: "EVA", gender: "unisex", measurements: "16x6x5 cm", branchId: "suc-2", branchName: "Indigo CDMX", stockAvailable: 50, stockReserved: 3, stockMin: 15, cost: 70, active: true, photos: [] },
  { id: "inv-28", displayId: 34, code: "EST-003", model: "Estuche de viaje compacto", description: "Estuche compacto plegable para viaje.", color: "Azul", type: "estuches", material: "Nylon", gender: "unisex", measurements: "14x5x4 cm", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 30, stockReserved: 0, stockMin: 10, cost: 95, active: true, photos: [] },

  { id: "inv-29", displayId: 35, code: "OTR-002", model: "Kit de limpieza completo", description: "Kit con paño, spray y destornillador de ajuste.", color: "Gris", type: "otros", material: "Mixto", gender: "unisex", measurements: "N/A", branchId: "suc-1", branchName: "Indigo Tapachula", stockAvailable: 40, stockReserved: 0, stockMin: 10, cost: 120, active: true, photos: [] },
  { id: "inv-30", displayId: 36, code: "OTR-003", model: "Soporte exhibidor de mostrador", description: "Soporte para exhibir armazones en mostrador.", color: "Transparente", type: "otros", material: "Acrílico", gender: "unisex", measurements: "20x15 cm", branchId: "suc-3", branchName: "Indigo Monterrey", stockAvailable: 10, stockReserved: 0, stockMin: 3, cost: 200, active: true, photos: [] },
];

let opticaSucursales = [
  {
    id: "osuc-1", displayId: 1, name: "Optica Centro",
    image: "", address: "Calle 5 #100", phone: "9611112222",
    country: "México", state: "Chiapas", municipality: "Tapachula",
    manager: "Marta", managerId: "u-oenc-1", managerPhone: "9611112223",
    staff: 2, products: 5, customers: 34, labJobs: 6, status: "active",
    staffList: [
      { name: "Marta", role: "Jefe de sucursal" },
      { name: "Luis", role: "Empleado" },
    ],
  },
  {
    id: "osuc-2", displayId: 2, name: "Optica Norte",
    image: "", address: "Av. Norte 300", phone: "9613334444",
    country: "México", state: "Ciudad de México", municipality: "Cuauhtémoc",
    manager: null, managerId: null, managerPhone: "",
    staff: 0, products: 0, customers: 0, labJobs: 0, status: "active",
    staffList: [],
  },
];

let opticaUsuarios = [
  { id: "u-odue-1", displayId: 1, name: "Sofia", username: "OPTDUENO1", role: "optica:dueno", branchId: null, branchName: "Sin sucursal", status: "active", phone: "", email: "sofia@optica.mx" },
  { id: "u-oenc-1", displayId: 2, name: "Marta", username: "OPTGTE1", role: "optica:encargado", branchId: "osuc-1", branchName: "Optica Centro", status: "active", phone: "9611112223", email: "marta@optica.mx" },
  { id: "u-oemp-1", displayId: 3, name: "Luis", username: "OPTEMP1", role: "optica:empleado", branchId: "osuc-1", branchName: "Optica Centro", status: "active", phone: "9611114444", email: "luis@optica.mx" },
  { id: "u-oemp-2", displayId: 4, name: "Ana Torres", username: "OPTEMP2", role: "optica:empleado", branchId: "osuc-1", branchName: "Optica Centro", status: "active", phone: "9611114445", email: "ana.torres@optica.mx" },
  { id: "u-oemp-3", displayId: 5, name: "Jorge Ramírez", username: "OPTEMP3", role: "optica:empleado", branchId: "osuc-1", branchName: "Optica Centro", status: "active", phone: "9611114446", email: "jorge.ramirez@optica.mx" },
  { id: "u-oemp-4", displayId: 6, name: "Paola Méndez", username: "OPTEMP4", role: "optica:empleado", branchId: "osuc-1", branchName: "Optica Centro", status: "active", phone: "9611114447", email: "paola.mendez@optica.mx" },
  { id: "u-oemp-5", displayId: 7, name: "Diego Castillo", username: "OPTEMP5", role: "optica:empleado", branchId: "osuc-1", branchName: "Optica Centro", status: "inactive", phone: "9611114448", email: "diego.castillo@optica.mx" },
  { id: "u-oemp-6", displayId: 8, name: "Valeria Nuñez", username: "OPTEMP6", role: "optica:empleado", branchId: "osuc-1", branchName: "Optica Centro", status: "active", phone: "9611114449", email: "valeria.nunez@optica.mx" },
  { id: "u-oemp-7", displayId: 9, name: "Hugo Pacheco", username: "OPTEMP7", role: "optica:empleado", branchId: "osuc-1", branchName: "Optica Centro", status: "active", phone: "9611114450", email: "hugo.pacheco@optica.mx" },
  { id: "u-oenc-2", displayId: 10, name: "Renata Solís", username: "OPTGTE2", role: "optica:encargado", branchId: "osuc-2", branchName: "Optica Norte", status: "active", phone: "9611114451", email: "renata.solis@optica.mx" },
  { id: "u-oemp-8", displayId: 11, name: "Iván Cordero", username: "OPTEMP8", role: "optica:empleado", branchId: "osuc-2", branchName: "Optica Norte", status: "active", phone: "9611114452", email: "ivan.cordero@optica.mx" },
  { id: "u-oemp-9", displayId: 12, name: "Fernanda Ibarra", username: "OPTEMP9", role: "optica:empleado", branchId: "osuc-2", branchName: "Optica Norte", status: "active", phone: "9611114453", email: "fernanda.ibarra@optica.mx" },
  { id: "u-oemp-10", displayId: 13, name: "Ricardo Villa", username: "OPTEMP10", role: "optica:empleado", branchId: "osuc-2", branchName: "Optica Norte", status: "inactive", phone: "9611114454", email: "ricardo.villa@optica.mx" },
];

let opticaInventario = [
  { id: "oinv-1", displayId: 1, code: "OPT-001", model: "Redonda Slim", description: "Armazón redondo delgado, línea premium.", color: "Azul", type: "armazones", material: "Life", gender: "mujer", measurements: "50-18-138", branchId: "osuc-1", branchName: "Optica Centro", stockAvailable: 6, stockReserved: 1, stockMin: 4, cost: 620, active: true, photos: [] },
  { id: "oinv-1b", displayId: 2, code: "OPT-001", model: "Redonda Slim", description: "Armazón redondo delgado, línea premium.", color: "Azul", type: "armazones", material: "Life", gender: "mujer", measurements: "50-18-138", branchId: "osuc-2", branchName: "Optica Norte", stockAvailable: 3, stockReserved: 0, stockMin: 4, cost: 620, active: true, photos: [] },
  { id: "oinv-2", displayId: 3, code: "OPT-002", model: "Clasica", description: "Armazón clásico de pasta.", color: "Café", type: "armazones", material: "Fashion", gender: "unisex", measurements: "52-19-140", branchId: "osuc-1", branchName: "Optica Centro", stockAvailable: 0, stockReserved: 0, stockMin: 3, cost: 300, active: true, photos: [] },
  { id: "oinv-3", displayId: 4, code: "MIC-OPT-001", model: "Antireflejante Plus", description: "Mica con tratamiento antirreflejante.", color: "Transparente", type: "micas", material: "Resistant Flex", gender: "unisex", measurements: "65mm", branchId: "osuc-1", branchName: "Optica Centro", stockAvailable: 9, stockReserved: 2, stockMin: 5, cost: 480, active: true, photos: [] },
  { id: "oinv-4", displayId: 5, code: "EST-OPT-001", model: "Estuche Rígido", description: "Estuche rígido con forro interior.", color: "Negro", type: "estuches", material: "Estándar", gender: "unisex", measurements: "16x6cm", branchId: "osuc-1", branchName: "Optica Centro", stockAvailable: 12, stockReserved: 0, stockMin: 5, cost: 85, active: true, photos: [] },
  { id: "oinv-5", displayId: 6, code: "ACC-OPT-001", model: "Cordón Deportivo", description: "Cordón ajustable para armazones.", color: "Negro", type: "accesorios", material: "Estándar", gender: "unisex", measurements: "70cm", branchId: "osuc-2", branchName: "Optica Norte", stockAvailable: 20, stockReserved: 0, stockMin: 8, cost: 45, active: true, photos: [] },
];

// =========================================================
// HELPERS: registran GET/POST/PUT/PATCH genéricos para un
// arreglo en memoria, imitando lo que hará el backend real.
// =========================================================

// `extra.onChange?.(accion, antes, despues, body)` es opcional - solo lo
// usa el registro de /api/indigo/usuarios para alimentar la Bitacora
// (Super usuario). El resto de los recursos no lo pasan, asi que no cambia
// nada para ellos.
function registrarCrud(basePath, getStore, extra = {}) {

  app.get(basePath, (req, res) => res.json(getStore()));

  app.post(basePath, (req, res) => {
    const item = extra.crear ? extra.crear(req.body) : req.body;
    getStore().unshift(item);
    extra.onChange?.("crear", null, item, req.body);
    res.status(201).json(item);
  });

  app.put(`${basePath}/:id`, (req, res) => {
    const store = getStore();
    const idx = store.findIndex((row) => row.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "No encontrado" });
    const antes = { ...store[idx] };
    store[idx] = { ...store[idx], ...(extra.actualizar ? extra.actualizar(req.body, store[idx]) : req.body) };
    extra.onChange?.("actualizar", antes, store[idx], req.body);
    res.json(store[idx]);
  });

  app.patch(`${basePath}/:id/deactivate`, (req, res) => {
    const store = getStore();
    const idx = store.findIndex((row) => row.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "No encontrado" });
    const antes = { ...store[idx] };
    store[idx] = { ...store[idx], status: "inactive", active: false };
    extra.onChange?.("baja", antes, store[idx], req.body);
    res.json(store[idx]);
  });

  app.patch(`${basePath}/:id/activate`, (req, res) => {
    const store = getStore();
    const idx = store.findIndex((row) => row.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "No encontrado" });
    const antes = { ...store[idx] };
    store[idx] = { ...store[idx], status: "active", active: true };
    extra.onChange?.("reactivacion", antes, store[idx], req.body);
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

// =========================================================
// BITACORA (Super usuario): historial de solo lectura de altas, bajas,
// ediciones y reseteos de contraseña sobre cuentas. Se alimenta sola cada
// vez que una accion sobre /api/indigo/usuarios trae quien la hizo
// (realizado_por_nombre) - las que no lo traen (ej. Gerente administrando
// a su propio equipo, o "Mi perfil") no se registran.
// =========================================================
let indigoBitacora = [
  {
    id: "bit-1", folio: "BIT-000407", tipo: "edicion",
    actorName: "Gerente Centro", actorRole: "indigo:gerente_sucursal", actorBranchName: "Centro",
    targetName: "Vendedor A", targetUsername: "ventas.centro01", targetRole: "indigo:empleado_ventas", targetBranchName: "Centro",
    changes: [{ field: "Usuario", before: "ventedor01", after: "ventas.centro01" }],
    team: "CAJA-CENTRO-02", at: daysAgo(0, 12.5),
  },
  {
    id: "bit-2", folio: "BIT-000406", tipo: "reseteo_contrasena",
    actorName: "Super usuario", actorRole: "indigo:super_usuario", actorBranchName: "",
    targetName: "Vendedor B", targetUsername: "ventas.centro02", targetRole: "indigo:empleado_ventas", targetBranchName: "Centro",
    changes: [], team: "CAJA-CENTRO-01", at: daysAgo(0, 10.25),
  },
  {
    id: "bit-3", folio: "BIT-000405", tipo: "edicion",
    actorName: "Super usuario", actorRole: "indigo:super_usuario", actorBranchName: "",
    targetName: "Laborista C", targetUsername: "lab.poniente01", targetRole: "indigo:empleado_laboratorio", targetBranchName: "Poniente",
    changes: [{ field: "Sucursal", before: "Sur", after: "Poniente" }],
    team: "LAB-PONIENTE-01", at: daysAgo(0, 9.05),
  },
  {
    id: "bit-4", folio: "BIT-000404", tipo: "baja",
    actorName: "Gerente Norte", actorRole: "indigo:gerente_sucursal", actorBranchName: "Norte",
    targetName: "Vendedor D", targetUsername: "ventas.norte04", targetRole: "indigo:empleado_ventas", targetBranchName: "Norte",
    changes: [], team: "CAJA-NORTE-04", at: daysAgo(1, 18.33),
  },
  {
    id: "bit-5", folio: "BIT-000403", tipo: "alta_usuario",
    actorName: "Super usuario", actorRole: "indigo:super_usuario", actorBranchName: "",
    targetName: "Gerente nuevo", targetUsername: "gte.oriente01", targetRole: "indigo:gerente_sucursal", targetBranchName: "Oriente",
    changes: [], team: "GTE-ORIENTE-01", at: daysAgo(1, 16.78),
  },
  {
    id: "bit-6", folio: "BIT-000402", tipo: "edicion",
    actorName: "Gerente Centro", actorRole: "indigo:gerente_sucursal", actorBranchName: "Centro",
    targetName: "Vendedor A", targetUsername: "ventas.centro01", targetRole: "indigo:empleado_ventas", targetBranchName: "Centro",
    changes: [{ field: "Teléfono", before: "9610000000", after: "9611112222" }],
    team: "CAJA-CENTRO-02", at: daysAgo(1, 12.5),
  },
  {
    id: "bit-7", folio: "BIT-000401", tipo: "reactivacion",
    actorName: "Super usuario", actorRole: "indigo:super_usuario", actorBranchName: "",
    targetName: "Subgerente Sur", targetUsername: "sub.sur01", targetRole: "indigo:subgerente", targetBranchName: "Sur",
    changes: [], team: "SUB-SUR-01", at: daysAgo(1, 9.17),
  },
  {
    id: "bit-8", folio: "BIT-000400", tipo: "edicion",
    actorName: "Super usuario", actorRole: "indigo:super_usuario", actorBranchName: "",
    targetName: "Empleado", targetUsername: "ventas.centro03", targetRole: "indigo:subgerente", targetBranchName: "Centro",
    changes: [{ field: "Rol", before: "Ventas", after: "Subgerente" }],
    team: "CAJA-CENTRO-03", at: daysAgo(2, 17.92),
  },
  {
    id: "bit-9", folio: "BIT-000399", tipo: "alta_usuario",
    actorName: "Gerente Sur", actorRole: "indigo:gerente_sucursal", actorBranchName: "Sur",
    targetName: "Vendedor nuevo", targetUsername: "ventas.sur05", targetRole: "indigo:empleado_ventas", targetBranchName: "Sur",
    changes: [], team: "CAJA-SUR-01", at: daysAgo(2, 13.03),
  },
  {
    id: "bit-10", folio: "BIT-000398", tipo: "baja",
    actorName: "Super usuario", actorRole: "indigo:super_usuario", actorBranchName: "",
    targetName: "Gerente Poniente", targetUsername: "gte.poniente01", targetRole: "indigo:gerente_sucursal", targetBranchName: "Poniente",
    changes: [], team: "GTE-PONIENTE-01", at: daysAgo(2, 10.33),
  },
];

let nextBitacoraFolio = 408;

function diffFields(antes, despues) {
  if (!antes) return [];
  const labels = { name: "Nombre", username: "Usuario", phone: "Teléfono", email: "Correo", role: "Rol", branchName: "Sucursal" };
  return Object.entries(labels)
    .filter(([key]) => antes[key] !== despues[key])
    .map(([key, label]) => ({ field: label, before: antes[key] ?? "—", after: despues[key] ?? "—" }));
}

function logBitacora({ tipo, actorName, actorRole, actorBranchName, targetName, targetUsername, targetRole, targetBranchName, changes, team }) {
  indigoBitacora.unshift({
    id: newId(),
    folio: `BIT-${String(nextBitacoraFolio++).padStart(6, "0")}`,
    tipo, actorName, actorRole, actorBranchName: actorBranchName || "",
    targetName, targetUsername, targetRole, targetBranchName: targetBranchName || "",
    changes: changes || [],
    team: team || "",
    at: new Date().toISOString(),
  });
}

app.get("/api/indigo/bitacora", (req, res) => res.json(indigoBitacora));

registrarCrud("/api/indigo/usuarios", () => indigoUsuarios, {
  crear: (body) => ({
    id: newId(), displayId: indigoUsuarios.length + 1,
    name: body.nombre, username: "NEW" + Math.floor(Math.random() * 10000),
    role: "indigo:empleado_ventas", branchId: body.sucursal_id || null,
    branchName: "Indigo Tapachula", status: "active",
  }),
  // El Gerente/Subgerente edita nombre, telefono, correo y puesto/rol del
  // empleado desde el modulo de Empleados (sucursal fija). El Super usuario
  // (modulo "Personal") ademas puede reasignar la sucursal.
  actualizar: (body) => {
    const patch = {};
    if (body.nombre !== undefined) patch.name = body.nombre;
    if (body.usuario !== undefined) patch.username = body.usuario;
    if (body.telefono !== undefined) patch.phone = body.telefono;
    if (body.correo !== undefined) patch.email = body.correo;
    if (body.puesto !== undefined) patch.role = body.puesto;
    if (body.sucursal_id !== undefined) {
      const branch = indigoSucursales.find((s) => s.id === body.sucursal_id);
      patch.branchId = body.sucursal_id || null;
      patch.branchName = branch?.name ?? "Sin sucursal";
    }
    // "Mi perfil" (todos los roles): contacto de emergencia.
    if (body.contacto_nombre !== undefined || body.contacto_telefono !== undefined || body.contacto_parentesco !== undefined) {
      patch.emergencyContact = {
        name: body.contacto_nombre ?? "",
        phone: body.contacto_telefono ?? "",
        relation: body.contacto_parentesco ?? "",
      };
    }
    return patch;
  },
  // Solo registra en Bitacora las acciones que traen quien las hizo - las
  // que no (Gerente administrando su equipo, "Mi perfil") se quedan igual.
  onChange: (accion, antes, despues, body) => {
    if (!body?.realizado_por_nombre) return;
    logBitacora({
      tipo: accion === "crear" ? "alta_usuario" : accion === "actualizar" ? "edicion" : accion === "baja" ? "baja" : "reactivacion",
      actorName: body.realizado_por_nombre,
      actorRole: body.realizado_por_rol,
      actorBranchName: body.realizado_por_sucursal,
      targetName: despues.name,
      targetUsername: despues.username,
      targetRole: despues.role,
      targetBranchName: despues.branchName,
      changes: accion === "actualizar" ? diffFields(antes, despues) : [],
    });
  },
});

// "Mi perfil": cambio de contraseña - el backend mock no guarda contraseñas
// reales (el login acepta cualquiera), asi que solo se simula el exito.
app.patch("/api/indigo/usuarios/:id/password", (req, res) => {
  const user = indigoUsuarios.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  if (!req.body.actual || !req.body.nueva) {
    return res.status(400).json({ error: "Faltan campos" });
  }
  res.json({ ok: true });
});

// Modulo "Personal" (Super usuario): restablece la contraseña de cualquier
// cuenta. El backend mock no guarda contraseñas reales, asi que solo marca
// la bandera de "debe cambiarla" y registra la accion en la Bitacora -
// nunca expone ni guarda una contraseña anterior.
app.patch("/api/indigo/usuarios/:id/resetear-password", (req, res) => {
  const user = indigoUsuarios.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  user.password_pendiente_cambio = true;

  if (req.body.realizado_por_nombre) {
    logBitacora({
      tipo: "reseteo_contrasena",
      actorName: req.body.realizado_por_nombre,
      actorRole: req.body.realizado_por_rol,
      actorBranchName: req.body.realizado_por_sucursal,
      targetName: user.name,
      targetUsername: user.username,
      targetRole: user.role,
      targetBranchName: user.branchName,
      changes: [],
    });
  }

  res.json({ ok: true });
});

// Modulo "Personal" (Super usuario): da de alta a CUALQUIER rol (incluido
// Dueño) en CUALQUIER sucursal - a diferencia de /gerentes, /subgerentes y
// /empleados que usa el Gerente/Subgerente, limitados a su propio equipo.
app.post("/api/indigo/usuarios/personal", (req, res) => {
  const body = req.body;
  const branch = indigoSucursales.find((s) => s.id === body.sucursal_id);

  const item = {
    id: newId(), displayId: indigoUsuarios.length + 1,
    name: body.nombre, username: body.usuario,
    role: body.rol, branchId: body.sucursal_id || null,
    branchName: branch?.name || (body.rol === "indigo:dueno" ? "Sin sucursal" : "Sin asignar"),
    status: "active", phone: body.telefono || "", email: body.correo || "",
    createdAt: new Date().toISOString(),
    emergencyContact: { name: "", phone: "", relation: "" },
    password_pendiente_cambio: Boolean(body.requiere_cambio_password),
  };
  indigoUsuarios.unshift(item);

  if (body.realizado_por_nombre) {
    logBitacora({
      tipo: "alta_usuario",
      actorName: body.realizado_por_nombre,
      actorRole: body.realizado_por_rol,
      actorBranchName: body.realizado_por_sucursal,
      targetName: item.name,
      targetUsername: item.username,
      targetRole: item.role,
      targetBranchName: item.branchName,
      changes: [],
    });
  }

  res.status(201).json(item);
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

// opticaSucursales se queda en su shape viejo (camelCase, con manager/
// staff/etc. pegados) porque Ventas/Pacientes/Reportes/Dashboard todavia
// lo usan asi - estas rutas traducen al shape real del back en la
// frontera (solo id/nombre/direccion/telefono/activo, SIN gerente ni
// conteos pegados: eso lo resuelve el front cruzando con Personal/
// Catálogo, ver withManagerInfo/withBranchCounts en branchService.js),
// igual criterio que usuarioAFormatoBack.
function sucursalAFormatoBack(s) {
  return {
    id: s.id,
    optica_id: "opt-1",
    nombre: s.name,
    direccion: s.address || null,
    telefono: s.phone || null,
    activo: s.status !== "inactive",
    created_at: s.created_at || new Date().toISOString(),
  };
}

app.get("/api/opticas/sucursales", (req, res) => {
  res.json(opticaSucursales.map(sucursalAFormatoBack));
});

// Alta de sucursal - el back no soporta crear un gerente nuevo aquí
// (crearSucursalSchema es estricto), solo asignar uno que ya exista.
// Responde {sucursal, gerente_asignado}, no la sucursal sola.
app.post("/api/opticas/sucursales", (req, res) => {
  const { nombre, direccion, telefono, gerente_optica_usuario_id } = req.body;
  const id = newId();
  const managerId = gerente_optica_usuario_id || null;
  const managerUser = managerId ? opticaUsuarios.find((u) => u.id === managerId) : null;

  const nueva = {
    id, displayId: opticaSucursales.length + 1,
    name: nombre, image: "", address: direccion || "", phone: telefono || "",
    country: "", state: "", municipality: "",
    manager: managerUser?.name ?? null, managerId, managerPhone: managerUser?.phone ?? "",
    staff: managerId ? 1 : 0, products: 0, customers: 0, status: "active",
    staffList: managerUser ? [{ name: managerUser.name, role: "optica:encargado" }] : [],
  };
  opticaSucursales.push(nueva);

  if (managerUser) {
    managerUser.branchId = id;
    managerUser.branchName = nombre;
  }

  res.status(201).json({
    message: "Sucursal creada correctamente",
    data: { sucursal: sucursalAFormatoBack(nueva), gerente_asignado: managerId ? { sucursal_id: id, optica_usuario_id: managerId } : null },
  });
});

// Editar sucursal - el back solo acepta nombre/dirección/teléfono aquí,
// el gerente se asigna/cambia por su propio endpoint (ver abajo).
app.patch("/api/opticas/sucursales/:id", (req, res) => {
  const sucursal = opticaSucursales.find((s) => s.id === req.params.id);
  if (!sucursal) return res.status(404).json({ error: "Sucursal no encontrada" });

  if (req.body.nombre !== undefined) sucursal.name = req.body.nombre;
  if (req.body.direccion !== undefined) sucursal.address = req.body.direccion;
  if (req.body.telefono !== undefined) sucursal.phone = req.body.telefono;

  res.json({ message: "Sucursal actualizada correctamente", data: sucursalAFormatoBack(sucursal) });
});

app.patch("/api/opticas/sucursales/:id/desactivar", (req, res) => {
  const sucursal = opticaSucursales.find((s) => s.id === req.params.id);
  if (!sucursal) return res.status(404).json({ error: "Sucursal no encontrada" });
  sucursal.status = "inactive";
  res.json({ message: "Sucursal desactivada correctamente", data: sucursalAFormatoBack(sucursal) });
});

app.patch("/api/opticas/sucursales/:id/activar", (req, res) => {
  const sucursal = opticaSucursales.find((s) => s.id === req.params.id);
  if (!sucursal) return res.status(404).json({ error: "Sucursal no encontrada" });
  sucursal.status = "active";
  res.json({ message: "Sucursal activada correctamente", data: sucursalAFormatoBack(sucursal) });
});

// Asignar gerente - solo si la sucursal NO tiene uno todavía.
app.post("/api/opticas/sucursales/gerente", (req, res) => {
  const { sucursal_id, optica_usuario_id } = req.body;
  const sucursal = opticaSucursales.find((s) => s.id === sucursal_id);
  if (!sucursal) return res.status(404).json({ error: "La sucursal no existe" });
  if (sucursal.managerId) return res.status(409).json({ error: "La sucursal ya tiene un gerente asignado" });

  const usuario = opticaUsuarios.find((u) => u.id === optica_usuario_id);
  if (!usuario) return res.status(404).json({ error: "El usuario no existe o no pertenece a esta óptica" });

  sucursal.managerId = usuario.id;
  sucursal.manager = usuario.name;
  sucursal.managerPhone = usuario.phone || "";
  usuario.branchId = sucursal.id;
  usuario.branchName = sucursal.name;

  res.status(201).json({
    message: "Gerente asignado correctamente",
    data: { sucursal_id, optica_usuario_id, created_at: new Date().toISOString() },
  });
});

// Cambiar gerente - solo si la sucursal YA tiene uno (lo reemplaza).
app.patch("/api/opticas/sucursales/:id/gerente", (req, res) => {
  const sucursal = opticaSucursales.find((s) => s.id === req.params.id);
  if (!sucursal) return res.status(404).json({ error: "Sucursal no encontrada" });
  if (!sucursal.managerId) return res.status(409).json({ error: "La sucursal no tiene un gerente asignado" });

  const usuario = opticaUsuarios.find((u) => u.id === req.body.optica_usuario_id);
  if (!usuario) return res.status(404).json({ error: "El usuario no existe o no pertenece a esta óptica" });

  const anterior = opticaUsuarios.find((u) => u.id === sucursal.managerId);
  if (anterior) anterior.branchId = null;

  sucursal.managerId = usuario.id;
  sucursal.manager = usuario.name;
  sucursal.managerPhone = usuario.phone || "";
  usuario.branchId = sucursal.id;
  usuario.branchName = sucursal.name;

  res.json({
    message: "Gerente cambiado correctamente",
    data: { sucursal_id: sucursal.id, optica_usuario_id: usuario.id, created_at: new Date().toISOString() },
  });
});

app.get("/api/opticas/sucursales/gerentes-disponibles", (req, res) => {
  const currentManagerId = req.query.gerente_actual_id;
  const asignados = new Set(opticaSucursales.map((s) => s.managerId).filter(Boolean));
  const disponibles = opticaUsuarios.filter(
    (u) => u.role === "optica:encargado" &&
      (!asignados.has(u.id) || u.id === currentManagerId)
  );
  res.json(disponibles.map((u) => ({ id: u.id, nombre: u.name })));
});

// opticaUsuarios sigue guardándose en el shape viejo (name/username/role
// con prefijo "optica:"/branchId) porque Sucursales y Ventas todavía
// dependen de ese shape en este mock - estas rutas traducen al shape real
// del back (nombre/telefono/email/usuario/rol/sucursal_id/activo) igual
// que hace usuarios.repository.js. El usuario y la contraseña ya NO se
// generan en el front: el back los genera al crear y los regresa una sola
// vez en credencial_provisional (ver usuarios.service.js del back).
function usuarioAFormatoBack(u) {
  return {
    id: u.id,
    optica_id: "opt-1",
    sucursal_id: u.branchId || null,
    nombre: u.name,
    telefono: u.phone || null,
    email: u.email || null,
    usuario: u.username,
    rol: (u.role || "").split(":")[1] || u.role,
    activo: u.status !== "inactive",
    dado_de_alta_por: null,
    created_at: u.created_at || new Date().toISOString(),
  };
}

function generarCredencial(prefijo) {
  return `${prefijo}${String(Math.floor(100000 + Math.random() * 900000))}`;
}

app.get("/api/opticas/usuarios", (req, res) => {
  res.json(opticaUsuarios.map(usuarioAFormatoBack));
});

// Alta de Jefe de sucursal (solo Dueño) - nunca lleva sucursal: se asigna
// después desde el módulo Sucursales.
app.post("/api/opticas/usuarios/gerentes", (req, res) => {
  const { nombre, telefono, email } = req.body;
  const credencial = generarCredencial("GTE");
  const nuevo = {
    id: newId(), displayId: opticaUsuarios.length + 1,
    name: nombre, username: credencial, role: "optica:encargado",
    branchId: null, branchName: "Sin asignar", status: "active",
    phone: telefono || "", email: email || "", created_at: new Date().toISOString(),
  };
  opticaUsuarios.unshift(nuevo);
  res.status(201).json({
    message: "Gerente creado con éxito",
    data: { ...usuarioAFormatoBack(nuevo), credencial_provisional: credencial },
  });
});

// Alta de Ventas (Dueño en cualquier sucursal, Jefe de sucursal solo en la suya).
app.post("/api/opticas/usuarios/empleados", (req, res) => {
  const { nombre, telefono, email, sucursal_id } = req.body;
  const branch = opticaSucursales.find((s) => s.id === sucursal_id);
  const credencial = generarCredencial("EMP");
  const nuevo = {
    id: newId(), displayId: opticaUsuarios.length + 1,
    name: nombre, username: credencial, role: "optica:empleado",
    branchId: sucursal_id || null, branchName: branch?.name || "Sin asignar", status: "active",
    phone: telefono || "", email: email || "", created_at: new Date().toISOString(),
  };
  opticaUsuarios.unshift(nuevo);
  res.status(201).json({
    message: "Empleado creado con éxito",
    data: { ...usuarioAFormatoBack(nuevo), credencial_provisional: credencial },
  });
});

// Editar personal / "Mi perfil": el back solo permite nombre/teléfono/
// correo/activo (ni el rol ni la sucursal se pueden cambiar aquí).
app.patch("/api/opticas/usuarios/:id", (req, res) => {
  const user = opticaUsuarios.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  if (req.body.nombre !== undefined) user.name = req.body.nombre;
  if (req.body.telefono !== undefined) user.phone = req.body.telefono;
  if (req.body.email !== undefined) user.email = req.body.email;
  if (req.body.activo !== undefined) user.status = req.body.activo ? "active" : "inactive";

  res.json({ message: "Usuario actualizado correctamente", data: usuarioAFormatoBack(user) });
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
  { id: "opac-4", sucursal_id: "osuc-1", nombre: "LAURA HERNÁNDEZ", telefono: "9611234568", email: "laura.hernandez@example.com", fecha_nacimiento: "1992-03-14", created_at: "2026-02-10T10:00:00.000Z", updated_at: "2026-02-10T10:00:00.000Z", active: true },
  { id: "opac-5", sucursal_id: "osuc-1", nombre: "PEDRO GÓMEZ", telefono: "9611234569", email: "pedro.gomez@example.com", fecha_nacimiento: "1978-07-22", created_at: "2026-02-12T10:00:00.000Z", updated_at: "2026-02-12T10:00:00.000Z", active: true },
  { id: "opac-6", sucursal_id: "osuc-1", nombre: "SOFÍA RAMÍREZ", telefono: "9611234570", email: "sofia.ramirez@example.com", fecha_nacimiento: "1999-01-30", created_at: "2026-02-15T10:00:00.000Z", updated_at: "2026-02-15T10:00:00.000Z", active: true },
  { id: "opac-7", sucursal_id: "osuc-1", nombre: "MIGUEL TORRES", telefono: "9611234571", email: null, fecha_nacimiento: "1995-09-18", created_at: "2026-02-18T10:00:00.000Z", updated_at: "2026-02-18T10:00:00.000Z", active: false },
  { id: "opac-8", sucursal_id: "osuc-1", nombre: "ANDREA CASTRO", telefono: "9611234572", email: "andrea.castro@example.com", fecha_nacimiento: "1988-12-05", created_at: "2026-02-20T10:00:00.000Z", updated_at: "2026-02-20T10:00:00.000Z", active: true },
  { id: "opac-9", sucursal_id: "osuc-1", nombre: "ROBERTO DÍAZ", telefono: "9611234573", email: "roberto.diaz@example.com", fecha_nacimiento: "1983-04-11", created_at: "2026-02-22T10:00:00.000Z", updated_at: "2026-02-22T10:00:00.000Z", active: true },
  { id: "opac-10", sucursal_id: "osuc-2", nombre: "CLAUDIA VARGAS", telefono: "9615551235", email: "claudia.vargas@example.com", fecha_nacimiento: "1991-06-25", created_at: "2026-02-24T10:00:00.000Z", updated_at: "2026-02-24T10:00:00.000Z", active: true },
  { id: "opac-11", sucursal_id: "osuc-2", nombre: "FERNANDO MORALES", telefono: "9615551236", email: "fernando.morales@example.com", fecha_nacimiento: "1987-10-09", created_at: "2026-02-26T10:00:00.000Z", updated_at: "2026-02-26T10:00:00.000Z", active: true },
  { id: "opac-12", sucursal_id: "osuc-2", nombre: "PATRICIA JIMÉNEZ", telefono: "9615551237", email: null, fecha_nacimiento: "1996-02-17", created_at: "2026-02-27T10:00:00.000Z", updated_at: "2026-02-27T10:00:00.000Z", active: true },
  { id: "opac-13", sucursal_id: "osuc-2", nombre: "ALEJANDRO SANTOS", telefono: "9615551238", email: "alejandro.santos@example.com", fecha_nacimiento: "1980-08-03", created_at: "2026-02-28T10:00:00.000Z", updated_at: "2026-02-28T10:00:00.000Z", active: false },
];

// Imita el contrato real de /api/opticas/pacientes: respuestas envueltas
// en { ok, paciente } / { ok, pacientes }. Los endpoints /deactivate y
// /activate NO existen en el backend real todavía (ver aviso al final).

// Agrega sucursal_nombre (lookup) a lo que ya trae cada registro, para que
// el frontend nunca tenga que resolverlo aparte - mismo criterio que
// indigoLaboratorio/branchName.
function withBranchName(paciente) {
  const branch = opticaSucursales.find((s) => s.id === paciente.sucursal_id);
  return { ...paciente, sucursal_nombre: branch?.name ?? null };
}

// Módulo "Clientes" del Dueño: todos los pacientes de la óptica, de todas
// las sucursales a la vez - sin necesidad de elegir una primero. El
// Encargado/Empleado siguen usando /sucursal/:sucursalId (una a la vez).
app.get("/api/opticas/pacientes", (req, res) => {
  res.json({ ok: true, pacientes: opticaPacientes.map(withBranchName) });
});

app.get("/api/opticas/pacientes/sucursal/:sucursalId", (req, res) => {
  const pacientes = opticaPacientes.filter((p) => p.sucursal_id === req.params.sucursalId).map(withBranchName);
  res.json({ ok: true, pacientes });
});

app.get("/api/opticas/pacientes/:id", (req, res) => {
  const paciente = opticaPacientes.find((p) => p.id === req.params.id);
  if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });
  res.json({ ok: true, paciente: withBranchName(paciente) });
});

app.post("/api/opticas/pacientes", (req, res) => {
  const body = req.body;
  const paciente = {
    id: newId(),
    sucursal_id: body.sucursalId || null,
    nombre: String(body.nombre || "").toUpperCase(),
    telefono: body.telefono || null,
    email: body.email || null,
    fecha_nacimiento: body.fechaNacimiento || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    active: true,
  };
  opticaPacientes.unshift(paciente);
  res.status(201).json({ ok: true, paciente: withBranchName(paciente) });
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
  res.json({ ok: true, paciente: withBranchName(opticaPacientes[idx]) });
});

// NO existen todavía en el backend real (propuesta de contrato):
app.patch("/api/opticas/pacientes/:id/deactivate", (req, res) => {
  const idx = opticaPacientes.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Paciente no encontrado" });
  opticaPacientes[idx] = { ...opticaPacientes[idx], active: false };
  res.json({ ok: true, paciente: withBranchName(opticaPacientes[idx]) });
});

app.patch("/api/opticas/pacientes/:id/activate", (req, res) => {
  const idx = opticaPacientes.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Paciente no encontrado" });
  opticaPacientes[idx] = { ...opticaPacientes[idx], active: true };
  res.json({ ok: true, paciente: withBranchName(opticaPacientes[idx]) });
});

let opticaConsultas = [
  {
    id: "ocons-1", sucursal_id: "osuc-1", cliente_final_id: "opac-1",
    fecha_examen: "2026-09-15",
    od_esfera: "-2.00", od_cilindro: "-0.50", od_eje: 90, od_adicion: null,
    oi_esfera: "-2.25", oi_cilindro: "-0.25", oi_eje: 85, oi_adicion: null,
    dip: "62.0", observaciones: "Paciente refiere fatiga visual al leer de cerca.",
    registrado_por: "u-oenc-1", created_at: "2026-09-15T11:00:00.000Z",
  },
  {
    id: "ocons-2", sucursal_id: "osuc-1", cliente_final_id: "opac-1",
    fecha_examen: "2026-03-10",
    od_esfera: "-1.75", od_cilindro: "-0.50", od_eje: 90, od_adicion: null,
    oi_esfera: "-2.00", oi_cilindro: "-0.25", oi_eje: 85, oi_adicion: null,
    dip: "62.0", observaciones: "",
    registrado_por: "u-oemp-1", created_at: "2026-03-10T09:30:00.000Z",
  },
];

function clienteNombreConsulta(id) {
  return opticaPacientes.find((p) => p.id === id)?.nombre ?? "—";
}

// Modulo nuevo (no hay nada viejo que imitar) - ya en el formato real del
// back: GET / regresa { success, data } directo, POST regresa
// { success, data }. Filtros de query iguales a listarConsultasQuerySchema.
app.get("/api/opticas/consultas", (req, res) => {
  const { sucursalId, clienteId, desde, hasta } = req.query;
  let consultas = opticaConsultas;
  if (sucursalId) consultas = consultas.filter((c) => c.sucursal_id === sucursalId);
  if (clienteId) consultas = consultas.filter((c) => c.cliente_final_id === clienteId);
  if (desde) consultas = consultas.filter((c) => c.fecha_examen >= desde);
  if (hasta) consultas = consultas.filter((c) => c.fecha_examen <= hasta);

  const data = consultas
    .slice()
    .sort((a, b) => (a.fecha_examen < b.fecha_examen ? 1 : -1))
    .map((c) => ({ ...c, cliente_nombre: clienteNombreConsulta(c.cliente_final_id) }));

  res.json({ success: true, data });
});

app.get("/api/opticas/consultas/:consultaId", (req, res) => {
  const consulta = opticaConsultas.find((c) => c.id === req.params.consultaId);
  if (!consulta) return res.status(404).json({ error: "Consulta no encontrada" });
  res.json({ success: true, data: { ...consulta, cliente_nombre: clienteNombreConsulta(consulta.cliente_final_id) } });
});

app.post("/api/opticas/consultas", (req, res) => {
  const body = req.body;
  const consulta = {
    id: newId(),
    sucursal_id: body.sucursalId || null,
    cliente_final_id: body.clienteId,
    fecha_examen: body.fechaExamen,
    od_esfera: body.od?.esfera ?? null, od_cilindro: body.od?.cilindro ?? null, od_eje: body.od?.eje ?? null, od_adicion: body.od?.adicion ?? null,
    oi_esfera: body.oi?.esfera ?? null, oi_cilindro: body.oi?.cilindro ?? null, oi_eje: body.oi?.eje ?? null, oi_adicion: body.oi?.adicion ?? null,
    dip: body.dip ?? null,
    observaciones: body.observaciones || null,
    registrado_por: null,
    created_at: new Date().toISOString(),
  };
  opticaConsultas.unshift(consulta);
  res.status(201).json({ success: true, data: { ...consulta, cliente_nombre: clienteNombreConsulta(consulta.cliente_final_id) } });
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
  { id: "ocit-8", sucursal_id: "osuc-1", cliente_final_id: "opac-4", fecha_hora: daysFromNow(5, 10), motivo: "Revisión anual", estado: "programada", creado_por: "u-oenc-1", created_at: daysFromNow(-1) },
  { id: "ocit-9", sucursal_id: "osuc-1", cliente_final_id: "opac-5", fecha_hora: daysFromNow(6, 11), motivo: "Ajuste de armazón", estado: "programada", creado_por: "u-oemp-1", created_at: daysFromNow(-1) },
  { id: "ocit-10", sucursal_id: "osuc-1", cliente_final_id: "opac-6", fecha_hora: daysFromNow(-4, 10), motivo: "Entrega de lentes", estado: "atendida", creado_por: "u-oenc-1", created_at: daysFromNow(-8) },
  { id: "ocit-11", sucursal_id: "osuc-1", cliente_final_id: "opac-7", fecha_hora: daysFromNow(-5, 9), motivo: "Consulta inicial", estado: "no_asistio", creado_por: "u-oemp-1", created_at: daysFromNow(-9) },
  { id: "ocit-12", sucursal_id: "osuc-1", cliente_final_id: "opac-8", fecha_hora: daysFromNow(7, 12), motivo: "Revisión de graduación", estado: "confirmada", creado_por: "u-oenc-1", created_at: daysFromNow(-1) },
  { id: "ocit-13", sucursal_id: "osuc-1", cliente_final_id: "opac-9", fecha_hora: daysFromNow(-6, 16), motivo: "Reparación de armazón", estado: "cancelada", creado_por: "u-oemp-1", created_at: daysFromNow(-10) },
  { id: "ocit-14", sucursal_id: "osuc-2", cliente_final_id: "opac-10", fecha_hora: daysFromNow(8, 10), motivo: "Consulta inicial", estado: "programada", creado_por: "u-odue-1", created_at: daysFromNow(-1) },
  { id: "ocit-15", sucursal_id: "osuc-2", cliente_final_id: "opac-11", fecha_hora: daysFromNow(9, 11), motivo: "Revisión anual", estado: "confirmada", creado_por: "u-odue-1", created_at: daysFromNow(-2) },
  { id: "ocit-16", sucursal_id: "osuc-2", cliente_final_id: "opac-12", fecha_hora: daysFromNow(-7, 9), motivo: "Entrega de lentes", estado: "atendida", creado_por: "u-odue-1", created_at: daysFromNow(-11) },
  { id: "ocit-17", sucursal_id: "osuc-2", cliente_final_id: "opac-13", fecha_hora: daysFromNow(-8, 13), motivo: "Adaptación de lentes de contacto", estado: "no_asistio", creado_por: "u-odue-1", created_at: daysFromNow(-12) },

  // Citas de hoy, para que la agenda del dashboard (Dueño) tenga algo que
  // mostrar sin esperar a que se agenden citas reales.
  { id: "ocit-18", sucursal_id: "osuc-1", cliente_final_id: "opac-1", fecha_hora: daysFromNow(0, 9), motivo: "Revisión anual", estado: "confirmada", creado_por: "u-oenc-1", created_at: daysFromNow(-1) },
  { id: "ocit-19", sucursal_id: "osuc-1", cliente_final_id: "opac-4", fecha_hora: daysFromNow(0, 10), motivo: "Entrega de lentes", estado: "confirmada", creado_por: "u-oemp-1", created_at: daysFromNow(-1) },
  { id: "ocit-20", sucursal_id: "osuc-1", cliente_final_id: "opac-5", fecha_hora: daysFromNow(0, 11), motivo: "Ajuste de armazón", estado: "programada", creado_por: "u-oenc-1", created_at: daysFromNow(-1) },
  { id: "ocit-21", sucursal_id: "osuc-2", cliente_final_id: "opac-10", fecha_hora: daysFromNow(0, 12), motivo: "Consulta inicial", estado: "programada", creado_por: "u-odue-1", created_at: daysFromNow(-1) },
  { id: "ocit-22", sucursal_id: "osuc-1", cliente_final_id: "opac-7", fecha_hora: daysFromNow(0, 14), motivo: "Reparación de armazón", estado: "confirmada", creado_por: "u-oemp-1", created_at: daysFromNow(-1) },
  { id: "ocit-23", sucursal_id: "osuc-2", cliente_final_id: "opac-11", fecha_hora: daysFromNow(0, 16), motivo: "Adaptación de lentes de contacto", estado: "programada", creado_por: "u-odue-1", created_at: daysFromNow(-1) },
];

// Contrato propuesto para citas: respuestas { success, data } (igual que
// devuelve hoy el controller real), con ?sucursalId= en el listado para
// que el dueño pueda elegir sucursal (el back real hoy solo usa
// req.user.sucursalId, que además está roto - ver aviso al final).

app.get("/api/opticas/citas", (req, res) => {
  const { sucursalId } = req.query;
  const citas = sucursalId ? opticaCitas.filter((c) => c.sucursal_id === sucursalId) : opticaCitas;
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
    sucursal_id: body.sucursalId || null,
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
    id: "oven-1", folio: "VEN-000001", sucursal_id: "osuc-1", paciente_id: "opac-1", metodo_pago: "efectivo",
    tipo_trabajo: "venta_directa", prioridad: "normal",
    estado: "completada", creado_por: "u-oenc-1", created_at: daysFromNow(-1),
    en_proceso_at: daysFromNow(-1), completada_at: daysFromNow(-1), cancelada_at: null, pagada_at: daysFromNow(-1),
    items: [{ producto_id: "oinv-1", codigo: "OPT-001", modelo: "Redonda Slim", cantidad: 1, precio_unitario: 620, subtotal: 620 }],
    subtotal: 620, iva: 99.2, total: 719.2, monto_pagado: 719.2, saldo_pendiente: 0,
  },
  {
    id: "oven-2", folio: "VEN-000002", sucursal_id: "osuc-1", paciente_id: "opac-1", metodo_pago: "credito",
    tipo_trabajo: "trabajo_interno", prioridad: "urgente",
    estado: "pendiente", creado_por: "u-oemp-1", created_at: daysFromNow(0),
    en_proceso_at: null, completada_at: null, cancelada_at: null, pagada_at: null,
    items: [{ producto_id: "oinv-3", codigo: "MIC-OPT-001", modelo: "Antireflejante Plus", cantidad: 2, precio_unitario: 480, subtotal: 960 }],
    subtotal: 960, iva: 153.6, total: 1113.6, monto_pagado: 700, saldo_pendiente: 413.6,
  },
  {
    id: "oven-3", folio: "VEN-000003", sucursal_id: "osuc-1", paciente_id: "opac-2", metodo_pago: "efectivo",
    tipo_trabajo: "venta_directa", prioridad: "normal",
    estado: "cancelada", creado_por: "u-oenc-1", created_at: daysFromNow(-3),
    en_proceso_at: null, completada_at: null, cancelada_at: daysFromNow(-3), pagada_at: null,
    items: [{ producto_id: "oinv-1", codigo: "OPT-001", modelo: "Redonda Slim", cantidad: 1, precio_unitario: 620, subtotal: 620 }],
    subtotal: 620, iva: 99.2, total: 719.2, monto_pagado: 719.2, saldo_pendiente: 0,
  },
  {
    id: "oven-4", folio: "VEN-000004", sucursal_id: "osuc-2", paciente_id: "opac-3", metodo_pago: "transferencia",
    tipo_trabajo: "venta_directa", prioridad: "normal",
    estado: "completada", creado_por: "u-odue-1", created_at: daysFromNow(-2),
    en_proceso_at: daysFromNow(-2), completada_at: daysFromNow(-2), cancelada_at: null, pagada_at: daysFromNow(-2),
    items: [{ producto_id: "oinv-1b", codigo: "OPT-001", modelo: "Redonda Slim", cantidad: 1, precio_unitario: 620, subtotal: 620 }],
    subtotal: 620, iva: 99.2, total: 719.2, monto_pagado: 719.2, saldo_pendiente: 0,
  },
  {
    id: "oven-5", folio: "VEN-000005", sucursal_id: "osuc-1", paciente_id: "opac-4", metodo_pago: "efectivo",
    tipo_trabajo: "orden_laboratorio", prioridad: "urgente",
    estado: "en_proceso", creado_por: "u-oenc-1", created_at: daysFromNow(-1),
    en_proceso_at: daysFromNow(-1), completada_at: null, cancelada_at: null, pagada_at: daysFromNow(-1),
    items: [{ producto_id: "oinv-4", codigo: "EST-OPT-001", modelo: "Estuche Rígido", cantidad: 1, precio_unitario: 85, subtotal: 85 }],
    subtotal: 85, iva: 13.6, total: 98.6, monto_pagado: 98.6, saldo_pendiente: 0,
  },
  {
    id: "oven-6", folio: "VEN-000006", sucursal_id: "osuc-1", paciente_id: "opac-5", metodo_pago: "debito",
    tipo_trabajo: "trabajo_interno", prioridad: "normal",
    estado: "completada", creado_por: "u-oemp-1", created_at: daysFromNow(-4),
    en_proceso_at: daysFromNow(-4), completada_at: daysFromNow(-4), cancelada_at: null, pagada_at: daysFromNow(-4),
    items: [{ producto_id: "oinv-5", codigo: "ACC-OPT-001", modelo: "Cordón Deportivo", cantidad: 1, precio_unitario: 45, subtotal: 45 }],
    subtotal: 45, iva: 7.2, total: 52.2, monto_pagado: 52.2, saldo_pendiente: 0,
  },
];

function nextVentaFolio() {
  const nums = opticaVentas
    .map((v) => parseInt(String(v.folio).replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `VEN-${String(max + 1).padStart(6, "0")}`;
}

function withVendedorName(venta) {
  const vendedor = opticaUsuarios.find((u) => u.id === venta.creado_por);
  return { ...venta, vendedor_nombre: vendedor?.name ?? "" };
}

// Contrato propuesto para ventas (modulo nuevo, sin nada en el back real):
// respuestas { ok, venta } / { ok, ventas }, con ?sucursalId= en el listado
// igual que pacientes/citas - sin sucursalId (o vacio) regresa las de
// todas las sucursales ("Todas"). Al crear una venta se descuenta el
// stock del producto; al cancelar, se repone.
//
// "estado" y los pagos son independientes:
// - estado: pendiente -> en_proceso -> completada (o cancelada, solo
//   mientras esta "pendiente"). Se mueve con PATCH /:id/estado, igual
//   que /api/opticas/laboratorio/:id/estado.
// - pago: no se guarda como estado, se deriva de saldo_pendiente
//   (liquidada si es 0, en_adeudo si no) - PATCH /:id/liquidar solo
//   abona al saldo, nunca toca "estado".

app.get("/api/opticas/ventas", (req, res) => {
  const { sucursalId } = req.query;
  const ventas = (sucursalId ? opticaVentas.filter((v) => v.sucursal_id === sucursalId) : opticaVentas)
    .map(withVendedorName);
  res.json({ ok: true, ventas });
});

app.get("/api/opticas/ventas/:id", (req, res) => {
  const venta = opticaVentas.find((v) => v.id === req.params.id);
  if (!venta) return res.status(404).json({ error: "Venta no encontrada" });
  res.json({ ok: true, venta: withVendedorName(venta) });
});

app.post("/api/opticas/ventas", (req, res) => {
  const body = req.body;

  const items = (body.items || []).map((item) => {
    let codigo = "";
    let modelo = "";

    if (item.itemType === "servicio") {
      const servicio = opticaServicios.find((s) => s.id === item.productoId);
      codigo = servicio?.codigo ?? "";
      modelo = servicio?.nombre ?? "";
    } else {
      const producto = opticaProductos.find((p) => p.id === item.productoId);
      codigo = producto?.codigo ?? "";
      modelo = producto?.nombre ?? "";

      const branchStock = producto?.stock_por_sucursal?.find((s) => s.sucursal_id === body.sucursalId);
      if (branchStock) {
        branchStock.stock = Math.max(0, branchStock.stock - Number(item.cantidad));
        opticaMovimientos.unshift({
          id: newId(), producto_id: producto.id, sucursal_id: body.sucursalId,
          tipo: "ventas", cantidad: Number(item.cantidad), motivo: "",
          creado_por: body.creadoPor || null,
          created_at: new Date().toISOString(),
        });
      }
    }

    return {
      producto_id: item.productoId,
      item_type: item.itemType === "servicio" ? "servicio" : "producto",
      codigo,
      modelo,
      cantidad: Number(item.cantidad),
      precio_unitario: Number(item.precioUnitario),
      subtotal: Number(item.cantidad) * Number(item.precioUnitario),
    };
  });

  // El front (igual que el back real, ver backend/ventas/helpers/calculos.js)
  // nunca manda iva/total/saldoPendiente ya calculados - solo manda tasaIva
  // y montoPagado. Antes esto se tomaba de body.iva/body.total/
  // body.saldoPendiente (siempre undefined) y por eso el IVA nunca se
  // aplicaba y el saldo pendiente siempre quedaba en 0, aunque el pago
  // fuera parcial.
  const subtotal = body.subtotal ?? items.reduce((sum, item) => sum + item.subtotal, 0);
  const tasaIva = Number(body.tasaIva ?? 0);
  const iva = body.iva ?? Math.round(subtotal * tasaIva) / 100;
  const total = body.total ?? Math.round((subtotal + iva) * 100) / 100;
  const tipoTrabajo = body.tipoTrabajo || "venta_directa";
  const montoPagado = Math.round(Number(body.montoPagado ?? total) * 100) / 100;
  const saldoPendiente = Math.max(0, Math.round((total - montoPagado) * 100) / 100);
  const ahora = new Date().toISOString();

  const venta = {
    id: newId(),
    folio: nextVentaFolio(),
    sucursal_id: body.sucursalId,
    paciente_id: body.pacienteId || null,
    creado_por: body.creadoPor || null,
    tipo_trabajo: tipoTrabajo,
    prioridad: body.prioridad === "urgente" ? "urgente" : "normal",
    metodo_pago: body.metodoPago,
    estado: "pendiente",
    created_at: ahora,
    en_proceso_at: null,
    completada_at: null,
    cancelada_at: null,
    pagada_at: saldoPendiente <= 0 ? ahora : null,
    items,
    subtotal,
    iva,
    total,
    monto_pagado: montoPagado,
    saldo_pendiente: saldoPendiente,
  };

  opticaVentas.unshift(venta);
  res.status(201).json({ ok: true, venta: withVendedorName(venta) });
});

// Abono al saldo pendiente - puede ser parcial o liquidar todo de una vez
// (si no mandan "monto", se asume el saldo completo). Solo pasa a
// "pagada" cuando el saldo llega a 0.
app.patch("/api/opticas/ventas/:id/liquidar", (req, res) => {
  const idx = opticaVentas.findIndex((v) => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Venta no encontrada" });

  const venta = opticaVentas[idx];
  const monto = Math.round(Math.max(0, Math.min(Number(req.body.monto ?? venta.saldo_pendiente), venta.saldo_pendiente)) * 100) / 100;
  // Centavo de tolerancia para que un resto de punto flotante (ej.
  // 2.8e-14) no deje el saldo pendiente por error de redondeo.
  const saldoRestante = Math.max(0, Math.round((venta.saldo_pendiente - monto) * 100) / 100);
  const quedaLiquidada = saldoRestante <= 0.01;

  opticaVentas[idx] = {
    ...venta,
    monto_pagado: Math.round((venta.monto_pagado + monto) * 100) / 100,
    saldo_pendiente: quedaLiquidada ? 0 : saldoRestante,
    pagada_at: quedaLiquidada ? (venta.pagada_at ?? new Date().toISOString()) : venta.pagada_at,
  };
  res.json({ ok: true, venta: withVendedorName(opticaVentas[idx]) });
});

// Transicion del estado del trabajo (pendiente -> en_proceso ->
// completada), igual patron que /api/opticas/laboratorio/:id/estado.
// Nunca toca los campos de pago.
app.patch("/api/opticas/ventas/:id/estado", (req, res) => {
  const idx = opticaVentas.findIndex((v) => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Venta no encontrada" });

  const venta = opticaVentas[idx];
  const estado = req.body.estado;
  const ahora = new Date().toISOString();

  opticaVentas[idx] = {
    ...venta,
    estado,
    en_proceso_at: estado === "en_proceso" ? (venta.en_proceso_at ?? ahora) : venta.en_proceso_at,
    completada_at: estado === "completada" ? (venta.completada_at ?? ahora) : venta.completada_at,
  };
  res.json({ ok: true, venta: withVendedorName(opticaVentas[idx]) });
});

app.patch("/api/opticas/ventas/:id/cancelar", (req, res) => {
  const idx = opticaVentas.findIndex((v) => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Venta no encontrada" });

  const venta = opticaVentas[idx];

  venta.items.forEach((item) => {
    if (item.item_type === "servicio") return;
    const producto = opticaProductos.find((p) => p.id === item.producto_id);
    const branchStock = producto?.stock_por_sucursal?.find((s) => s.sucursal_id === venta.sucursal_id);
    if (branchStock) {
      branchStock.stock += item.cantidad;
    }
  });

  opticaVentas[idx] = { ...venta, estado: "cancelada", cancelada_at: new Date().toISOString() };
  res.json({ ok: true, venta: withVendedorName(opticaVentas[idx]) });
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
  correo_fiscal: "fiscal@opticavision.mx",
  calle: "Av. Central",
  numero_exterior: "123",
  numero_interior: "",
  colonia: "Centro",
  codigo_postal: "30700",
  municipio: "Tapachula",
  estado_direccion: "Chiapas",
  pais: "México",
  regimen_fiscal: "general_personas_morales",
  color_principal: "#1E3AAB",
  color_secundario: "#60DAFA",
  eslogan: "Cuidando tu visión desde 1998",
};

// El front ya manda/espera snake_case (ver opticaService.js), así que aquí
// no hace falta traducir nombres de campo, solo imitar las 4 rutas reales:
// operativa (cualquier rol), completa/crear/actualizar (dueño).

app.get("/api/opticas/configuracion/operativa", (req, res) => {
  const { nombre_comercial, logo_url, color_principal, color_secundario, eslogan } = opticaInfo;
  res.json({ nombre_comercial, logo_url, color_principal, color_secundario, eslogan });
});

app.get("/api/opticas/configuracion", (req, res) => {
  res.json(opticaInfo);
});

app.post("/api/opticas/configuracion", (req, res) => {
  opticaInfo = { ...opticaInfo, ...req.body };
  res.status(201).json(opticaInfo);
});

app.patch("/api/opticas/configuracion", (req, res) => {
  opticaInfo = { ...opticaInfo, ...req.body };
  res.json(opticaInfo);
});

// ---- Productos, Servicios y Stock (catalogo + existencias por sucursal) ----
// Alineado con el back real: productos/servicios son por óptica (no por
// sucursal), las existencias viven aparte en Stock, y las categorías son
// catálogos fijos con id numérico (categorias_productos/categorias_servicios).

const categoriasProductos = [
  { id: 1, nombre: "Armazones" }, { id: 2, nombre: "Lentes oftálmicos" }, { id: 3, nombre: "Lentes de contacto" },
  { id: 4, nombre: "Soluciones" }, { id: 5, nombre: "Estuches" }, { id: 6, nombre: "Paños" },
  { id: 7, nombre: "Cadenas" }, { id: 8, nombre: "Accesorios" }, { id: 9, nombre: "Otros" },
];
const categoriasServicios = [
  { id: 1, nombre: "Consulta" }, { id: 2, nombre: "Ajustes" }, { id: 3, nombre: "Reparaciones" }, { id: 4, nombre: "Otros" },
];
const categoriaProductoNombre = (id) => categoriasProductos.find((c) => c.id === id)?.nombre ?? "";
const categoriaServicioNombre = (id) => categoriasServicios.find((c) => c.id === id)?.nombre ?? "";

const CATEGORIA_PRODUCTO_POR_SLUG = {
  armazones: 1, lentes_oftalmicos: 2, lentes_contacto: 3, soluciones: 4,
  estuches: 5, panos: 6, cadenas: 7, accesorios: 8,
};
const CATEGORIA_SERVICIO_POR_SLUG = { consultas: 1, ajustes: 2, reparaciones: 3 };

// Semilla con la forma vieja (categoria en texto, stock embebido por
// producto) - se transforma abajo a la forma real: productos sin stock
// embebido + un arreglo de Stock aparte por producto+sucursal.
const opticaProductosSemilla = [
  { id: "oprod-1", display_id: 1, codigo: "ARM-CAT-001", nombre: "Armazón Clásico", categoria: "armazones", marca: "OKI Eyewear", descripcion: "Armazón de acetato clásico.", precio_venta: 890, stock_por_sucursal: [{ sucursal_id: "osuc-1", stock: 10 }, { sucursal_id: "osuc-2", stock: 4 }], stock_minimo: 5 },
  { id: "oprod-2", display_id: 2, codigo: "MIC-CAT-001", nombre: "Mica Antireflejante", categoria: "lentes_oftalmicos", marca: "Resistant Flex", descripcion: "Mica con tratamiento antirreflejante.", precio_venta: 650, stock_por_sucursal: [{ sucursal_id: "osuc-2", stock: 6 }, { sucursal_id: "osuc-1", stock: 3 }], stock_minimo: 5 },
  { id: "oprod-3", display_id: 3, codigo: "SOL-CAT-001", nombre: "Solución multipropósito", categoria: "soluciones", marca: "OptiCare", descripcion: "Solución para lentes de contacto 355ml.", precio_venta: 180, stock_por_sucursal: [{ sucursal_id: "osuc-1", stock: 31 }, { sucursal_id: "osuc-2", stock: 14 }], stock_minimo: 10 },
  { id: "oprod-4", display_id: 4, codigo: "ARM-CAT-002", nombre: "Armazón Aviador Metal", categoria: "armazones", marca: "OKI Eyewear", descripcion: "Armazón metálico estilo aviador.", precio_venta: 920, stock_por_sucursal: [{ sucursal_id: "osuc-1", stock: 8 }, { sucursal_id: "osuc-2", stock: 4 }], stock_minimo: 5 },
  { id: "oprod-5", display_id: 5, codigo: "ARM-CAT-003", nombre: "Armazón Wayfarer", categoria: "armazones", marca: "JD Sport", descripcion: "Armazón compacto estilo wayfarer.", precio_venta: 780, stock_por_sucursal: [{ sucursal_id: "osuc-2", stock: 2 }, { sucursal_id: "osuc-1", stock: 1 }], stock_minimo: 5 },
  { id: "oprod-6", display_id: 6, codigo: "ARM-CAT-004", nombre: "Armazón Redondo Vintage", categoria: "armazones", marca: "Cactus", descripcion: "Armazón redondo de inspiración vintage.", precio_venta: 850, stock_por_sucursal: [{ sucursal_id: "osuc-1", stock: 0 }, { sucursal_id: "osuc-2", stock: 0 }], stock_minimo: 4 },
  { id: "oprod-7", display_id: 7, codigo: "ARM-CAT-005", nombre: "Armazón Infantil", categoria: "armazones", marca: "Toki Kids", descripcion: "Armazón flexible resistente para niños.", precio_venta: 620, stock_por_sucursal: [{ sucursal_id: "osuc-2", stock: 18 }, { sucursal_id: "osuc-1", stock: 7 }], stock_minimo: 8 },
  { id: "oprod-8", display_id: 8, codigo: "MIC-CAT-002", nombre: "Mica Progresiva HD", categoria: "lentes_oftalmicos", marca: "Progresivos Superfit", descripcion: "Mica progresiva de alta definición.", precio_venta: 1800, stock_por_sucursal: [{ sucursal_id: "osuc-1", stock: 6 }, { sucursal_id: "osuc-2", stock: 2 }], stock_minimo: 5 },
  { id: "oprod-9", display_id: 9, codigo: "MIC-CAT-003", nombre: "Mica Fotocromática", categoria: "lentes_oftalmicos", marca: "Antibue Premium", descripcion: "Mica que se oscurece con la luz solar.", precio_venta: 1200, stock_por_sucursal: [{ sucursal_id: "osuc-2", stock: 4 }, { sucursal_id: "osuc-1", stock: 2 }], stock_minimo: 5 },
  { id: "oprod-10", display_id: 10, codigo: "MIC-CAT-004", nombre: "Mica Filtro Luz Azul", categoria: "lentes_oftalmicos", marca: "Photoflux", descripcion: "Mica con filtro de luz azul.", precio_venta: 950, stock_por_sucursal: [{ sucursal_id: "osuc-1", stock: 0 }, { sucursal_id: "osuc-2", stock: 0 }], stock_minimo: 5 },
  { id: "oprod-11", display_id: 11, codigo: "LEN-CAT-001", nombre: "Lentes de contacto mensuales", categoria: "lentes_contacto", marca: "Acuvue", descripcion: "Caja de lentes de contacto de uso mensual.", precio_venta: 550, stock_por_sucursal: [{ sucursal_id: "osuc-2", stock: 28 }, { sucursal_id: "osuc-1", stock: 12 }], stock_minimo: 10 },
  { id: "oprod-12", display_id: 12, codigo: "LEN-CAT-002", nombre: "Lentes de contacto diarios", categoria: "lentes_contacto", marca: "Biofinity", descripcion: "Caja de 30 lentes de contacto diarios.", precio_venta: 680, stock_por_sucursal: [{ sucursal_id: "osuc-1", stock: 11 }, { sucursal_id: "osuc-2", stock: 4 }], stock_minimo: 10 },
  { id: "oprod-13", display_id: 13, codigo: "SOL-CAT-002", nombre: "Gotas humectantes", categoria: "soluciones", marca: "OptiFree", descripcion: "Gotas humectantes para ojo seco.", precio_venta: 150, stock_por_sucursal: [{ sucursal_id: "osuc-2", stock: 35 }, { sucursal_id: "osuc-1", stock: 15 }], stock_minimo: 10 },
  { id: "oprod-14", display_id: 14, codigo: "SOL-CAT-003", nombre: "Solución para lentes rígidos", categoria: "soluciones", marca: "Boston", descripcion: "Solución limpiadora para lentes rígidos.", precio_venta: 220, stock_por_sucursal: [{ sucursal_id: "osuc-1", stock: 1 }, { sucursal_id: "osuc-2", stock: 1 }], stock_minimo: 5 },
  { id: "oprod-15", display_id: 15, codigo: "EST-CAT-001", nombre: "Estuche rígido", categoria: "estuches", marca: "Genérico", descripcion: "Estuche rígido con cierre.", precio_venta: 150, stock_por_sucursal: [{ sucursal_id: "osuc-2", stock: 21 }, { sucursal_id: "osuc-1", stock: 9 }], stock_minimo: 10 },
  { id: "oprod-16", display_id: 16, codigo: "EST-CAT-002", nombre: "Estuche semirrígido", categoria: "estuches", marca: "Genérico", descripcion: "Estuche semirrígido con broche.", precio_venta: 120, stock_por_sucursal: [{ sucursal_id: "osuc-1", stock: 13 }, { sucursal_id: "osuc-2", stock: 5 }], stock_minimo: 10 },
  { id: "oprod-17", display_id: 17, codigo: "PAN-CAT-001", nombre: "Paño de microfibra", categoria: "panos", marca: "Zeiss", descripcion: "Paño de microfibra para limpieza.", precio_venta: 60, stock_por_sucursal: [{ sucursal_id: "osuc-2", stock: 70 }, { sucursal_id: "osuc-1", stock: 30 }], stock_minimo: 20 },
  { id: "oprod-18", display_id: 18, codigo: "PAN-CAT-002", nombre: "Paño antibacterial", categoria: "panos", marca: "Clean Optics", descripcion: "Paño antibacterial para limpieza de lentes.", precio_venta: 70, stock_por_sucursal: [{ sucursal_id: "osuc-1", stock: 0 }, { sucursal_id: "osuc-2", stock: 0 }], stock_minimo: 15 },
  { id: "oprod-19", display_id: 19, codigo: "CAD-CAT-001", nombre: "Cadena deportiva", categoria: "cadenas", marca: "Genérico", descripcion: "Cadena deportiva ajustable para lentes.", precio_venta: 90, stock_por_sucursal: [{ sucursal_id: "osuc-2", stock: 15 }, { sucursal_id: "osuc-1", stock: 7 }], stock_minimo: 10 },
  { id: "oprod-20", display_id: 20, codigo: "CAD-CAT-002", nombre: "Cadena decorativa", categoria: "cadenas", marca: "Genérico", descripcion: "Cadena decorativa para lentes.", precio_venta: 110, stock_por_sucursal: [{ sucursal_id: "osuc-1", stock: 4 }, { sucursal_id: "osuc-2", stock: 1 }], stock_minimo: 8 },
  { id: "oprod-21", display_id: 21, codigo: "ACC-CAT-001", nombre: "Spray limpiador", categoria: "accesorios", marca: "OptiClean", descripcion: "Spray limpiador para lentes.", precio_venta: 85, stock_por_sucursal: [{ sucursal_id: "osuc-2", stock: 42 }, { sucursal_id: "osuc-1", stock: 18 }], stock_minimo: 15 },
  { id: "oprod-22", display_id: 22, codigo: "ACC-CAT-002", nombre: "Kit de ajuste de armazones", categoria: "accesorios", marca: "Genérico", descripcion: "Kit de mini herramientas para ajuste.", precio_venta: 200, stock_por_sucursal: [{ sucursal_id: "osuc-1", stock: 7 }, { sucursal_id: "osuc-2", stock: 3 }], stock_minimo: 5 },
  { id: "oprod-23", display_id: 23, codigo: "ACC-CAT-003", nombre: "Funda protectora", categoria: "accesorios", marca: "Genérico", descripcion: "Funda protectora acolchada.", precio_venta: 95, stock_por_sucursal: [{ sucursal_id: "osuc-2", stock: 1 }, { sucursal_id: "osuc-1", stock: 0 }], stock_minimo: 5 },
];

let opticaStock = [];
let opticaProductos = opticaProductosSemilla.map((p) => {
  (p.stock_por_sucursal ?? []).forEach((s) => {
    opticaStock.push({ producto_id: p.id, sucursal_id: s.sucursal_id, cantidad: s.stock });
  });
  const categoria_id = CATEGORIA_PRODUCTO_POR_SLUG[p.categoria] ?? 9;
  return {
    id: p.id, display_id: p.display_id, sku: p.codigo, nombre: p.nombre,
    categoria_id, categoria_nombre: categoriaProductoNombre(categoria_id),
    marca: p.marca, descripcion: p.descripcion,
    precio_venta: p.precio_venta, stock_minimo: p.stock_minimo, activo: true,
  };
});

const opticaServiciosSemilla = [
  { id: "oserv-1", display_id: 1, codigo: "SRV-001", nombre: "Examen de la vista", categoria: "consultas", descripcion: "Evaluación completa de agudeza visual.", precio: 300 },
  { id: "oserv-2", display_id: 2, codigo: "SRV-002", nombre: "Ajuste de armazón", categoria: "ajustes", descripcion: "Ajuste y calibración de armazón.", precio: 0 },
  { id: "oserv-3", display_id: 3, codigo: "SRV-003", nombre: "Reparación de armazón", categoria: "reparaciones", descripcion: "Reparación de bisagra o varilla.", precio: 150 },
];
let opticaServicios = opticaServiciosSemilla.map((s) => {
  const categoria_id = CATEGORIA_SERVICIO_POR_SLUG[s.categoria] ?? 4;
  return {
    id: s.id, display_id: s.display_id, codigo: s.codigo, nombre: s.nombre,
    categoria_id, categoria_nombre: categoriaServicioNombre(categoria_id),
    descripcion: s.descripcion, precio: s.precio, activo: true,
  };
});

function nombreUsuarioOptica(id) {
  return opticaUsuarios.find((u) => u.id === id)?.name ?? "—";
}

// -- Productos --

app.get("/api/opticas/productos/categorias", (req, res) => res.json(categoriasProductos));

app.get("/api/opticas/productos", (req, res) => res.json(opticaProductos));

app.get("/api/opticas/productos/:id", (req, res) => {
  const producto = opticaProductos.find((p) => p.id === req.params.id);
  if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(producto);
});

app.post("/api/opticas/productos", (req, res) => {
  const categoria_id = Number(req.body.categoriaId);
  const nuevo = {
    id: newId(), display_id: opticaProductos.length + 1,
    sku: req.body.sku || null, nombre: req.body.nombre,
    categoria_id, categoria_nombre: categoriaProductoNombre(categoria_id),
    marca: req.body.marca || null, descripcion: req.body.descripcion || null,
    precio_venta: Number(req.body.precioVenta), stock_minimo: Number(req.body.stockMinimo) || 0,
    activo: true,
  };
  opticaProductos.unshift(nuevo);
  res.status(201).json(nuevo);
});

app.patch("/api/opticas/productos/:id", (req, res) => {
  const idx = opticaProductos.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Producto no encontrado" });
  const cambios = { ...req.body };
  if (cambios.categoriaId !== undefined) {
    cambios.categoria_id = Number(cambios.categoriaId);
    cambios.categoria_nombre = categoriaProductoNombre(cambios.categoria_id);
    delete cambios.categoriaId;
  }
  if (cambios.precioVenta !== undefined) { cambios.precio_venta = Number(cambios.precioVenta); delete cambios.precioVenta; }
  if (cambios.stockMinimo !== undefined) { cambios.stock_minimo = Number(cambios.stockMinimo); delete cambios.stockMinimo; }
  opticaProductos[idx] = { ...opticaProductos[idx], ...cambios };
  res.json(opticaProductos[idx]);
});

app.patch("/api/opticas/productos/:id/estado", (req, res) => {
  const idx = opticaProductos.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Producto no encontrado" });
  opticaProductos[idx] = { ...opticaProductos[idx], activo: Boolean(req.body.activo) };
  res.json(opticaProductos[idx]);
});

// -- Servicios --

app.get("/api/opticas/servicios/categorias", (req, res) => res.json(categoriasServicios));

app.get("/api/opticas/servicios", (req, res) => res.json(opticaServicios));

app.post("/api/opticas/servicios", (req, res) => {
  const categoria_id = Number(req.body.categoriaId);
  const nuevo = {
    id: newId(), display_id: opticaServicios.length + 1,
    codigo: req.body.codigo || null, nombre: req.body.nombre,
    categoria_id, categoria_nombre: categoriaServicioNombre(categoria_id),
    descripcion: req.body.descripcion || null, precio: Number(req.body.precio), activo: true,
  };
  opticaServicios.unshift(nuevo);
  res.status(201).json(nuevo);
});

app.patch("/api/opticas/servicios/:id", (req, res) => {
  const idx = opticaServicios.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Servicio no encontrado" });
  const cambios = { ...req.body };
  if (cambios.categoriaId !== undefined) {
    cambios.categoria_id = Number(cambios.categoriaId);
    cambios.categoria_nombre = categoriaServicioNombre(cambios.categoria_id);
    delete cambios.categoriaId;
  }
  if (cambios.precio !== undefined) cambios.precio = Number(cambios.precio);
  opticaServicios[idx] = { ...opticaServicios[idx], ...cambios };
  res.json(opticaServicios[idx]);
});

app.patch("/api/opticas/servicios/:id/estado", (req, res) => {
  const idx = opticaServicios.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Servicio no encontrado" });
  opticaServicios[idx] = { ...opticaServicios[idx], activo: Boolean(req.body.activo) };
  res.json(opticaServicios[idx]);
});

// -- Stock (existencias + movimientos, separado del catálogo) --

let opticaMovimientos = [
  { id: "omov-1", producto_id: "oprod-11", sucursal_id: "osuc-1", tipo: "entrada", cantidad: 20, cantidad_anterior: 0, cantidad_nueva: 20, motivo: "Reabastecimiento de proveedor", creado_por: "u-oenc-1", created_at: daysFromNow(0) },
  { id: "omov-2", producto_id: "oprod-3", sucursal_id: "osuc-1", tipo: "salida", cantidad: 2, cantidad_anterior: 33, cantidad_nueva: 31, motivo: "Venta mostrador", creado_por: "u-oemp-1", created_at: daysFromNow(0) },
  { id: "omov-3", producto_id: "oprod-11", sucursal_id: "osuc-2", tipo: "salida", cantidad: 2, cantidad_anterior: 30, cantidad_nueva: 28, motivo: "Venta mostrador", creado_por: "u-odue-1", created_at: daysFromNow(0) },
  { id: "omov-4", producto_id: "oprod-7", sucursal_id: "osuc-2", tipo: "salida", cantidad: 2, cantidad_anterior: 20, cantidad_nueva: 18, motivo: "Venta mostrador", creado_por: "u-odue-1", created_at: daysFromNow(-1) },
  { id: "omov-5", producto_id: "oprod-3", sucursal_id: "osuc-1", tipo: "salida", cantidad: 3, cantidad_anterior: 34, cantidad_nueva: 31, motivo: "Venta mostrador", creado_por: "u-oemp-1", created_at: daysFromNow(-1) },
  { id: "omov-6", producto_id: "oprod-15", sucursal_id: "osuc-1", tipo: "entrada", cantidad: 10, cantidad_anterior: 0, cantidad_nueva: 10, motivo: "Reabastecimiento de proveedor", creado_por: "u-oenc-1", created_at: daysFromNow(-2) },
  { id: "omov-7", producto_id: "oprod-1", sucursal_id: "osuc-2", tipo: "ajuste", cantidad: 1, cantidad_anterior: 3, cantidad_nueva: 4, motivo: "Conteo físico", creado_por: "u-odue-1", created_at: daysFromNow(-3) },
  { id: "omov-8", producto_id: "oprod-9", sucursal_id: "osuc-1", tipo: "salida", cantidad: 1, cantidad_anterior: 3, cantidad_nueva: 2, motivo: "Producto dañado", creado_por: "u-oenc-1", created_at: daysFromNow(-4) },
];

app.get("/api/opticas/stock", (req, res) => {
  const { sucursalId } = req.query;
  const filas = opticaStock
    .filter((s) => !sucursalId || s.sucursal_id === sucursalId)
    .map((s) => {
      const producto = opticaProductos.find((p) => p.id === s.producto_id);
      if (!producto) return null;
      return {
        producto_id: s.producto_id, nombre: producto.nombre, sku: producto.sku, marca: producto.marca,
        activo: producto.activo, categoria_id: producto.categoria_id, categoria_nombre: producto.categoria_nombre,
        precio_venta: producto.precio_venta, cantidad: s.cantidad, stock_minimo: producto.stock_minimo,
      };
    })
    .filter(Boolean);
  res.json(filas);
});

app.get("/api/opticas/stock/:productoId/movimientos", (req, res) => {
  const { sucursalId } = req.query;
  const filas = opticaMovimientos
    .filter((m) => m.producto_id === req.params.productoId && (!sucursalId || m.sucursal_id === sucursalId))
    .map((m) => ({
      id: m.id, tipo: m.tipo, cantidad: m.cantidad,
      cantidad_anterior: m.cantidad_anterior, cantidad_nueva: m.cantidad_nueva,
      motivo: m.motivo, realizado_por: m.creado_por, realizado_por_nombre: nombreUsuarioOptica(m.creado_por),
      created_at: m.created_at,
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(filas);
});

app.patch("/api/opticas/stock/:productoId", (req, res) => {
  const { sucursalId, tipo, cantidad, motivo } = req.body;
  let entry = opticaStock.find((s) => s.producto_id === req.params.productoId && s.sucursal_id === sucursalId);
  if (!entry) {
    entry = { producto_id: req.params.productoId, sucursal_id: sucursalId, cantidad: 0 };
    opticaStock.push(entry);
  }

  const cantidadAnterior = entry.cantidad;
  const cantidadNum = Math.max(0, Number(cantidad) || 0);
  let cantidadNueva;
  if (tipo === "entrada") cantidadNueva = cantidadAnterior + cantidadNum;
  else if (tipo === "salida") cantidadNueva = Math.max(0, cantidadAnterior - cantidadNum);
  else cantidadNueva = cantidadNum; // ajuste: valor absoluto

  entry.cantidad = cantidadNueva;

  const movimiento = {
    id: newId(), producto_id: req.params.productoId, sucursal_id: sucursalId,
    tipo, cantidad: Math.abs(cantidadNueva - cantidadAnterior),
    cantidad_anterior: cantidadAnterior, cantidad_nueva: cantidadNueva,
    motivo: motivo || "", creado_por: null, created_at: new Date().toISOString(),
  };
  opticaMovimientos.unshift(movimiento);

  res.json({
    stock: { producto_id: req.params.productoId, sucursal_id: sucursalId, cantidad: cantidadNueva },
    movimiento,
  });
});

// =========================================================
// REPORTES (modulo nuevo del back real, hecho por Leo) - resumenes
// calculados aqui mismo en JS sobre los arreglos de arriba, imitando las
// sumas/conteos que el back hace con SQL. No se implementa /inventario ni
// /inventario/movimientos: el front no los usa (la pestaña Inventario de
// Reportes sigue viendo datos reales via Catalogo/Stock) y, en el back
// real, /inventario/movimientos hoy ademas es inalcanzable por un bug de
// rutas (ver conversacion con Leo).
// =========================================================

function sucursalIdsDeQuery(req) {
  const { sucursalId } = req.query;
  if (sucursalId) return [sucursalId];
  return opticaSucursales.map((s) => s.id);
}

function enRangoFecha(fechaIso, desde, hasta) {
  if (!fechaIso) return false;
  const t = new Date(fechaIso).getTime();
  if (desde && t < new Date(desde).getTime()) return false;
  if (hasta && t >= new Date(hasta).getTime()) return false;
  return true;
}

// Mismo default que el back real (periodo="month") cuando no mandan
// desde/hasta - ver reportes.schema.js/resolverRango.
function periodoADesdeHasta(periodo) {
  const ahora = new Date();
  let desde;
  if (periodo === "day") { desde = new Date(ahora); desde.setHours(0, 0, 0, 0); }
  else if (periodo === "week") { desde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000); }
  else if (periodo === "year") { desde = new Date(ahora.getFullYear(), 0, 1); }
  else { desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1); }
  return { desde: desde.toISOString(), hasta: ahora.toISOString() };
}

function resolverRangoQuery(query) {
  if (query.desde || query.hasta) return { desde: query.desde, hasta: query.hasta };
  return periodoADesdeHasta(query.periodo || "month");
}

function redondear(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

// Solo cuenta ventas totalmente pagadas, igual que `v.monto_pagado = v.total`
// del back real (ver reporte.repository.js, #base).
function ventasFiltradas(sucursalIds, desde, hasta) {
  return opticaVentas.filter((v) =>
    sucursalIds.includes(v.sucursal_id) &&
    v.estado !== "cancelada" &&
    v.monto_pagado === v.total &&
    enRangoFecha(v.created_at, desde, hasta)
  );
}

function contarCitas(citas) {
  return {
    total: citas.length,
    programadas: citas.filter((c) => c.estado === "programada").length,
    confirmadas: citas.filter((c) => c.estado === "confirmada").length,
    atendidas: citas.filter((c) => c.estado === "atendida").length,
    canceladas: citas.filter((c) => c.estado === "cancelada").length,
    no_asistio: citas.filter((c) => c.estado === "no_asistio").length,
  };
}

function agruparVentas(ventas, agrupar, limit) {
  if (agrupar === "producto" || agrupar === "servicio") {
    const map = new Map();
    ventas.forEach((v) => {
      (v.items || []).forEach((item) => {
        const tipo = item.item_type || "producto";
        if (tipo !== agrupar) return;
        const key = item.modelo || item.codigo || "Sin nombre";
        const entry = map.get(key) || { etiqueta: key, cantidad: 0, total: 0 };
        entry.cantidad += Number(item.cantidad || 0);
        entry.total += Number(item.subtotal || 0);
        map.set(key, entry);
      });
    });
    return [...map.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, limit)
      .map((r) => ({ ...r, total: redondear(r.total) }));
  }

  const keyFn = agrupar === "sucursal" ? (v) => v.sucursal_id
    : agrupar === "empleado" ? (v) => v.creado_por
    : (v) => (v.created_at || "").slice(0, 10);

  const labelFn = agrupar === "sucursal" ? (k) => opticaSucursales.find((s) => s.id === k)?.name ?? "—"
    : agrupar === "empleado" ? (k) => nombreUsuarioOptica(k)
    : (k) => k;

  const map = new Map();
  ventas.forEach((v) => {
    const key = keyFn(v);
    const entry = map.get(key) || { etiqueta: labelFn(key), operaciones: 0, total: 0 };
    entry.operaciones += 1;
    entry.total += Number(v.total || 0);
    map.set(key, entry);
  });

  return [...map.values()]
    .map((e) => ({ ...e, total: redondear(e.total), ticket_promedio: redondear(e.total / e.operaciones) }))
    .sort((a, b) => (agrupar === "dia" ? (a.etiqueta < b.etiqueta ? -1 : 1) : b.total - a.total))
    .slice(0, limit);
}

app.get("/api/opticas/reportes/resumen", (req, res) => {
  const { desde, hasta } = resolverRangoQuery(req.query);
  const sucursalIds = sucursalIdsDeQuery(req);

  const ventas = ventasFiltradas(sucursalIds, desde, hasta);
  const total = ventas.reduce((sum, v) => sum + Number(v.total || 0), 0);
  const operaciones = ventas.length;

  const citas = opticaCitas.filter((c) => sucursalIds.includes(c.sucursal_id) && enRangoFecha(c.fecha_hora, desde, hasta));

  const pacientesScope = opticaPacientes.filter((p) => sucursalIds.includes(p.sucursal_id));
  const nuevos = pacientesScope.filter((p) => enRangoFecha(p.created_at, desde, hasta)).length;

  const ventasRango = opticaVentas.filter((v) =>
    sucursalIds.includes(v.sucursal_id) && v.estado !== "cancelada" && enRangoFecha(v.created_at, desde, hasta));
  const comprasPorCliente = new Map();
  ventasRango.forEach((v) => {
    if (v.paciente_id) comprasPorCliente.set(v.paciente_id, (comprasPorCliente.get(v.paciente_id) || 0) + 1);
  });
  const recurrentes = [...comprasPorCliente.values()].filter((n) => n >= 2).length;

  const citasAtendidas = opticaCitas.filter((c) =>
    sucursalIds.includes(c.sucursal_id) && c.estado === "atendida" && enRangoFecha(c.fecha_hora, desde, hasta));
  const atendidos = new Set(citasAtendidas.map((c) => c.cliente_final_id)).size;

  res.json({
    success: true,
    data: {
      periodo: req.query.desde || req.query.hasta ? "personalizado" : (req.query.periodo || "month"),
      sucursales: sucursalIds.length,
      ventas: { total: redondear(total), operaciones, ticket_promedio: operaciones > 0 ? redondear(total / operaciones) : 0 },
      citas: contarCitas(citas),
      clientes: { total: pacientesScope.length, nuevos, recurrentes, atendidos },
      inventario: null,
    },
  });
});

app.get("/api/opticas/reportes/ventas", (req, res) => {
  const { desde, hasta } = resolverRangoQuery(req.query);
  const { agrupar, vendedorId, productoId, servicioId, limit } = req.query;
  const sucursalIds = sucursalIdsDeQuery(req);

  let ventas = ventasFiltradas(sucursalIds, desde, hasta);
  if (vendedorId) ventas = ventas.filter((v) => v.creado_por === vendedorId);

  let total;
  let operaciones;
  if (productoId || servicioId) {
    let suma = 0;
    const idsConMatch = new Set();
    ventas.forEach((v) => {
      (v.items || []).forEach((item) => {
        const tipo = item.item_type || "producto";
        if (productoId && tipo === "producto" && item.producto_id === productoId) {
          suma += Number(item.subtotal || 0);
          idsConMatch.add(v.id);
        }
        if (servicioId && tipo === "servicio" && item.producto_id === servicioId) {
          suma += Number(item.subtotal || 0);
          idsConMatch.add(v.id);
        }
      });
    });
    total = suma;
    operaciones = idsConMatch.size;
  } else {
    total = ventas.reduce((sum, v) => sum + Number(v.total || 0), 0);
    operaciones = ventas.length;
  }

  res.json({
    success: true,
    data: {
      total: redondear(total),
      operaciones,
      ticket_promedio: operaciones > 0 ? redondear(total / operaciones) : 0,
      agrupar: agrupar || null,
      desglose: agrupar ? agruparVentas(ventas, agrupar, Number(limit) || 20) : null,
    },
  });
});

app.get("/api/opticas/reportes/servicios", (req, res) => {
  const { desde, hasta } = resolverRangoQuery(req.query);
  const { servicioId, limit } = req.query;
  const sucursalIds = sucursalIdsDeQuery(req);
  const ventas = ventasFiltradas(sucursalIds, desde, hasta);

  const map = new Map();
  let solicitados = 0, realizados = 0, ingreso = 0;

  ventas.forEach((v) => {
    (v.items || []).forEach((item) => {
      if ((item.item_type || "producto") !== "servicio") return;
      if (servicioId && item.producto_id !== servicioId) return;

      const cantidad = Number(item.cantidad || 0);
      const subtotal = Number(item.subtotal || 0);
      solicitados += cantidad;
      ingreso += subtotal;
      if (v.estado === "completada") realizados += cantidad;

      const key = item.producto_id;
      const entry = map.get(key) || { servicio_id: key, etiqueta: item.modelo || item.codigo, cantidad: 0, realizados: 0, ingreso: 0 };
      entry.cantidad += cantidad;
      if (v.estado === "completada") entry.realizados += cantidad;
      entry.ingreso += subtotal;
      map.set(key, entry);
    });
  });

  const ranking = [...map.values()]
    .sort((a, b) => b.cantidad - a.cantidad || b.ingreso - a.ingreso)
    .slice(0, Number(limit) || 10)
    .map((r) => ({ ...r, ingreso: redondear(r.ingreso) }));

  res.json({ success: true, data: { solicitados, realizados, ingreso: redondear(ingreso), ranking } });
});

app.get("/api/opticas/reportes/clientes", (req, res) => {
  const { desde, hasta } = resolverRangoQuery(req.query);
  const sucursalIds = sucursalIdsDeQuery(req);

  const pacientesScope = opticaPacientes.filter((p) => sucursalIds.includes(p.sucursal_id));
  const nuevos = pacientesScope.filter((p) => enRangoFecha(p.created_at, desde, hasta)).length;

  const ventasScope = opticaVentas.filter((v) =>
    sucursalIds.includes(v.sucursal_id) && v.estado !== "cancelada" && enRangoFecha(v.created_at, desde, hasta));
  const comprasPorCliente = new Map();
  ventasScope.forEach((v) => {
    if (v.paciente_id) comprasPorCliente.set(v.paciente_id, (comprasPorCliente.get(v.paciente_id) || 0) + 1);
  });
  const recurrentes = [...comprasPorCliente.values()].filter((n) => n >= 2).length;

  const citasScope = opticaCitas.filter((c) =>
    sucursalIds.includes(c.sucursal_id) && c.estado === "atendida" && enRangoFecha(c.fecha_hora, desde, hasta));
  const atendidos = new Set(citasScope.map((c) => c.cliente_final_id)).size;

  res.json({ success: true, data: { total: pacientesScope.length, nuevos, recurrentes, atendidos } });
});

app.get("/api/opticas/reportes/citas", (req, res) => {
  const { desde, hasta } = resolverRangoQuery(req.query);
  const { estado, agrupar } = req.query;
  const sucursalIds = sucursalIdsDeQuery(req);

  let citas = opticaCitas.filter((c) => sucursalIds.includes(c.sucursal_id) && enRangoFecha(c.fecha_hora, desde, hasta));
  if (estado) citas = citas.filter((c) => c.estado === estado);

  let desglose = null;
  if (agrupar === "dia") {
    const map = new Map();
    citas.forEach((c) => {
      const key = (c.fecha_hora || "").slice(0, 10);
      map.set(key, [...(map.get(key) || []), c]);
    });
    desglose = [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([etiqueta, list]) => ({ etiqueta, ...contarCitas(list) }));
  } else if (agrupar === "sucursal") {
    const map = new Map();
    citas.forEach((c) => {
      map.set(c.sucursal_id, [...(map.get(c.sucursal_id) || []), c]);
    });
    desglose = [...map.entries()]
      .map(([sid, list]) => ({ etiqueta: opticaSucursales.find((s) => s.id === sid)?.name ?? "—", ...contarCitas(list) }))
      .sort((a, b) => b.total - a.total);
  }

  res.json({ success: true, data: { ...contarCitas(citas), agrupar: agrupar || null, desglose } });
});

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`Mock backend corriendo en http://localhost:${PORT}`);
});
