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
  { id: "suc-1", displayId: 1, name: "Indigo Tapachula", address: "Av. Central 123", phone: "9611234567", manager: "Erick", managerId: "u-gte-1", staff: 4, products: 12, status: "active" },
  { id: "suc-2", displayId: 2, name: "Indigo CDMX", address: "Reforma 500", phone: "5512345678", manager: null, managerId: null, staff: 0, products: 0, status: "active" },
  { id: "suc-3", displayId: 3, name: "Indigo Monterrey", address: "Constitución 200", phone: "8111223344", manager: null, managerId: null, staff: 0, products: 0, status: "active" },
];

let indigoUsuarios = [
  { id: "u-super", displayId: 1, name: "Katia", username: "KAT", role: "indigo:super_usuario", branchId: null, branchName: "Sin sucursal", status: "active" },
  { id: "u-due-1", displayId: 2, name: "Urbino", username: "DUE111111", role: "indigo:dueno", branchId: null, branchName: "Sin sucursal", status: "active" },
  { id: "u-gte-1", displayId: 3, name: "Erick", username: "GTE111111", role: "indigo:gerente_sucursal", branchId: "suc-1", branchName: "Indigo Tapachula", status: "active" },
  { id: "u-vta-1", displayId: 4, name: "Yoanna", username: "VTA111111", role: "indigo:empleado_ventas", branchId: "suc-1", branchName: "Indigo Tapachula", status: "active" },
  { id: "u-lab-1", displayId: 5, name: "Leo", username: "LAB111111", role: "indigo:empleado_laboratorio", branchId: "suc-1", branchName: "Indigo Tapachula", status: "active" },
];

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

registrarCrud("/api/indigo/sucursales", () => indigoSucursales, {
  crear: (body) => ({
    id: newId(), displayId: indigoSucursales.length + 1,
    name: body.nombre, address: body.direccion || null, phone: body.telefono || null,
    manager: body.nuevo_gerente_nombre || null, managerId: body.gerente_indigo_usuario_id || null,
    staff: 0, products: 0, status: "active",
  }),
  actualizar: (body) => ({
    name: body.nombre, address: body.direccion || null, phone: body.telefono || null,
  }),
});

app.get("/api/indigo/sucursales/gerentes-disponibles", (req, res) => {
  res.json([{ id: "u-gte-2", nombre: "Saúl" }]);
});

registrarCrud("/api/indigo/usuarios", () => indigoUsuarios, {
  crear: (body) => ({
    id: newId(), displayId: indigoUsuarios.length + 1,
    name: body.nombre, username: "NEW" + Math.floor(Math.random() * 10000),
    role: "indigo:empleado_ventas", branchId: body.sucursal_id || null,
    branchName: "Indigo Tapachula", status: "active",
  }),
});

app.get("/api/indigo/usuarios/opciones-formulario", (req, res) => {
  res.json({
    roles: [
      { value: "INDIGO_BRANCH_MANAGER", label: "Gerente de sucursal" },
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
      ventasHoy: 4200, cantidadVentasHoy: 9, ordenesLaboratorio: 3,
      empleados: 4, ventas: 9, totalVentas: 4200,
      pendientes: 2, enProceso: 1, total: 3,
    },
    salesByBranch: indigoSucursales.map((s) => ({ id: s.id, branch: s.name, sales: 3, total: 2100 })),
    salesByEmployee: [{ name: "Yoanna", sales: 2100 }],
    laboratory: [{ id: "1", order: "LAB-001", customer: "Cliente 1", status: "pending" }],
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

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`Mock backend corriendo en http://localhost:${PORT}`);
});
