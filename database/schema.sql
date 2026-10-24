CREATE EXTENSION IF NOT EXISTS "pgcrypto";


CREATE TABLE credenciales (
    usuario VARCHAR(100) PRIMARY KEY,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('indigo', 'optica')),
    referencia_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE indigo_sucursales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE indigo_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID REFERENCES indigo_sucursales(id),
    nombre VARCHAR(150) NOT NULL,
    usuario VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol VARCHAR(30) NOT NULL
        CHECK (rol IN ('super_usuario', 'dueno', 'gerente_sucursal', 'empleado_ventas', 'empleado_laboratorio')),
    dado_de_alta_por UUID REFERENCES indigo_usuarios(id),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE inventario_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('mica', 'armazon', 'lente_contacto', 'otro')),
    nombre VARCHAR(150) NOT NULL,
    marca VARCHAR(100),
    material VARCHAR(100),
    tratamiento VARCHAR(150),
    esfera_min NUMERIC(4,2),
    esfera_max NUMERIC(4,2),
    cilindro_min NUMERIC(4,2),
    cilindro_max NUMERIC(4,2),
    adicion_min NUMERIC(4,2),
    adicion_max NUMERIC(4,2),
    precio_lista NUMERIC(10,2),
    creado_por UUID REFERENCES indigo_usuarios(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);


--Vamos a cambiar de almacen para saber a que sucursal le pertenece
CREATE TABLE inventario_existencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES inventario_items(id),
    indigo_sucursal_id UUID REFERENCES indigo_sucursales(id),
    --almacen VARCHAR(100),
    cantidad INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);




CREATE TABLE opticas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    razon_social VARCHAR(200) NOT NULL,
    password_hash TEXT NOT NULL,              
    password_cambiada BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    creado_por UUID REFERENCES indigo_usuarios(id),   
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);



CREATE TABLE optica_configuracion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    optica_id UUID NOT NULL UNIQUE REFERENCES opticas(id),    
    --  Informacion de la empresa
    nombre_comercial VARCHAR(150),
    responsable_sanitario VARCHAR(150),
    razon_social VARCHAR(150),
    telefono VARCHAR(20),
    correo VARCHAR(254),
    -- Domicilio fiscal
    calle VARCHAR(150),
    numero_exterior VARCHAR(20),
    numero_interior VARCHAR(20),
    colonia VARCHAR(100),
    codigo_postal VARCHAR(10),
    municipio VARCHAR(100),
    estado_direccion VARCHAR(100),
    pais VARCHAR(100) NOT NULL DEFAULT 'México',
    -- Configuración comercial y fiscal
    rfc VARCHAR(13),
    regimen_fiscal VARCHAR(10),
    correo_fiscal VARCHAR(254),
    -- Identidad visual
    logo_url TEXT,
    color_principal CHAR(7) NOT NULL DEFAULT '#1E3AAB',
    color_secundario CHAR(7) NOT NULL DEFAULT '#60DAFA',
    eslogan VARCHAR(200),
    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Restricciones
    CONSTRAINT chk_optica_configuracion_color_principal
        CHECK (color_principal ~ '^#[0-9A-Fa-f]{6}$'),

    CONSTRAINT chk_optica_configuracion_color_secundario
        CHECK (color_secundario ~ '^#[0-9A-Fa-f]{6}$')
);




CREATE TABLE sucursales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    optica_id UUID NOT NULL REFERENCES opticas(id),
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

--Una sucursal optica puede tener una en tuxtla y no por eso se le va a mostrar el inventario de tapchula
CREATE TABLE sucursal_proveedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL UNIQUE REFERENCES sucursales(id),
    indigo_sucursal_id UUID NOT NULL REFERENCES indigo_sucursales(id),
    asignado_por UUID REFERENCES indigo_usuarios(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE optica_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    optica_id UUID NOT NULL REFERENCES opticas(id),
    sucursal_id UUID REFERENCES sucursales(id),
    nombre VARCHAR(150) NOT NULL,
    usuario VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    rol VARCHAR(30) NOT NULL CHECK (rol IN ('dueno', 'encargado', 'empleado')),
    dado_de_alta_por UUID REFERENCES optica_usuarios(id),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(optica_id, usuario)
);

CREATE TABLE sucursal_gerentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL UNIQUE REFERENCES sucursales(id),
    optica_usuario_id UUID NOT NULL REFERENCES optica_usuarios(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE clientes_finales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    nombre VARCHAR(200) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(150),
    fecha_nacimiento DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE consultas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_final_id UUID NOT NULL REFERENCES clientes_finales(id),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    fecha_examen DATE NOT NULL,
    od_esfera NUMERIC(4,2), od_cilindro NUMERIC(4,2), od_eje INTEGER, od_adicion NUMERIC(4,2),
    oi_esfera NUMERIC(4,2), oi_cilindro NUMERIC(4,2), oi_eje INTEGER, oi_adicion NUMERIC(4,2),
    dip NUMERIC(4,1),
    observaciones TEXT,
    registrado_por UUID REFERENCES optica_usuarios(id),
    created_at TIMESTAMPTZ DEFAULT now()
);


-- CREATE TABLE productos_servicios (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     sucursal_id UUID NOT NULL REFERENCES sucursales(id),
--     tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('producto', 'servicio')),
--     nombre VARCHAR(150) NOT NULL,
--     precio NUMERIC(10,2) NOT NULL,
--     inventario_item_id UUID REFERENCES inventario_items(id),
--     stock_local INTEGER,
--     activo BOOLEAN DEFAULT TRUE,
--     created_at TIMESTAMPTZ DEFAULT now()
-- );


-- Categorías fijas (globales, solo lectura desde la API)
CREATE TABLE categorias_productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE categorias_servicios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);


-- Inser de categorias para tablas ocupar en productos y servicios
INSERT INTO categorias_productos (nombre) VALUES
 ('Armazones'),('Lentes oftálmicos'),('Lentes de contacto'),('Soluciones'),
 ('Estuches'),('Paños'),('Cadenas'),('Accesorios'),('Otros');
INSERT INTO categorias_servicios (nombre) VALUES
 ('Consulta'),('Ajustes'),('Reparaciones'), ('Otros');



-- Tabla de productos y servicios
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    optica_id UUID NOT NULL REFERENCES opticas(id),
    nombre VARCHAR(150) NOT NULL,
    sku VARCHAR(50),
    marca VARCHAR(100),
    categoria_id INTEGER NOT NULL REFERENCES categorias_productos(id),
    descripcion TEXT,
    precio_venta NUMERIC(10,2) NOT NULL CHECK (precio_venta >= 0),
    stock_minimo INTEGER NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_por UUID REFERENCES optica_usuarios(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    optica_id UUID NOT NULL REFERENCES opticas(id),
    nombre VARCHAR(150) NOT NULL,
    categoria_id INTEGER NOT NULL REFERENCES categorias_servicios(id),
    codigo VARCHAR(50),
    descripcion TEXT,
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_por UUID REFERENCES optica_usuarios(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE stock (
    producto_id UUID NOT NULL REFERENCES productos(id),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    cantidad INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (producto_id, sucursal_id)
);


CREATE TABLE stock_movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    cantidad_anterior INTEGER NOT NULL,
    cantidad_nueva INTEGER NOT NULL,
    motivo VARCHAR(200),
    realizado_por UUID NOT NULL REFERENCES optica_usuarios(id),
    created_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio VARCHAR(30) UNIQUE NOT NULL,
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    cliente_final_id UUID REFERENCES clientes_finales(id),
    vendedor_id UUID NOT NULL REFERENCES optica_usuarios(id),
    total NUMERIC(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'completada' CHECK (estado IN ('completada', 'cancelada')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE venta_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES ventas(id),
    producto_servicio_id UUID NOT NULL REFERENCES productos_servicios(id),
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL
);

CREATE TABLE citas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    cliente_final_id UUID NOT NULL REFERENCES clientes_finales(id),
    fecha_hora TIMESTAMPTZ NOT NULL,
    motivo VARCHAR(200),
    estado VARCHAR(20) DEFAULT 'programada'
        CHECK (estado IN ('programada', 'confirmada', 'atendida', 'cancelada', 'no_asistio')),
    creado_por UUID REFERENCES optica_usuarios(id),
    created_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE ordenes_laboratorio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio VARCHAR(30) UNIQUE NOT NULL,
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    cliente_final_id UUID NOT NULL REFERENCES clientes_finales(id),
    expediente_id UUID REFERENCES consultas(id),
    venta_id UUID REFERENCES ventas(id),
    item_id UUID REFERENCES inventario_items(id),
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'aceptado', 'en_proceso', 'terminado_lab', 'terminado_venta', 'cancelado')),
    notas TEXT,
    creado_por UUID REFERENCES optica_usuarios(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE ordenes_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES ordenes_laboratorio(id),
    estado_anterior VARCHAR(30),
    estado_nuevo VARCHAR(30) NOT NULL,
    cambiado_por_tipo VARCHAR(10) NOT NULL CHECK (cambiado_por_tipo IN ('indigo', 'optica')),
    cambiado_por_id UUID NOT NULL,   -- referencia a indigo_usuarios o optica_usuarios según el tipo
    created_at TIMESTAMPTZ DEFAULT now()
);



CREATE INDEX idx_credenciales_referencia ON credenciales(referencia_id);
CREATE INDEX idx_indigo_usuarios_sucursal ON indigo_usuarios(sucursal_id);
CREATE INDEX idx_sucursales_optica ON sucursales(optica_id);
CREATE INDEX idx_sucursal_proveedor_indigo ON sucursal_proveedor(indigo_sucursal_id);
CREATE INDEX idx_inventario_existencias_indigo_sucursal ON inventario_existencias(indigo_sucursal_id);
CREATE INDEX idx_optica_usuarios_optica ON optica_usuarios(optica_id);
CREATE INDEX idx_optica_usuarios_sucursal ON optica_usuarios(sucursal_id);
CREATE INDEX idx_sucursal_gerentes_usuario ON sucursal_gerentes(optica_usuario_id);
CREATE INDEX idx_clientes_finales_sucursal ON clientes_finales(sucursal_id);

CREATE INDEX idx_ventas_sucursal ON ventas(sucursal_id);
CREATE INDEX idx_citas_sucursal ON citas(sucursal_id);
CREATE INDEX idx_citas_fecha ON citas(fecha_hora);
CREATE INDEX idx_ordenes_lab_sucursal ON ordenes_laboratorio(sucursal_id);
CREATE INDEX idx_ordenes_lab_estado ON ordenes_laboratorio(estado);
CREATE INDEX idx_ordenes_historial_orden ON ordenes_historial(orden_id);
CREATE INDEX idx_inventario_existencias_item ON inventario_existencias(item_id);

CREATE INDEX idx_consultas_sucursal_fecha ON consultas (sucursal_id, fecha_examen);
CREATE INDEX idx_consultas_cliente ON consultas (cliente_final_id, fecha_examen);

CREATE INDEX idx_productos_servicios_sucursal ON productos_servicios (sucursal_id);

CREATE UNIQUE INDEX uq_productos_optica_sku
    ON productos (optica_id, sku) WHERE sku IS NOT NULL;

CREATE INDEX idx_productos_optica ON productos (optica_id, activo);

CREATE UNIQUE INDEX uq_servicios_optica_codigo
    ON servicios (optica_id, codigo) WHERE codigo IS NOT NULL;
CREATE INDEX idx_servicios_optica ON servicios (optica_id, activo);

CREATE INDEX idx_stock_sucursal ON stock (sucursal_id);


CREATE INDEX idx_stock_mov_producto_sucursal
    ON stock_movimientos (producto_id, sucursal_id, created_at DESC);

CREATE INDEX idx_productos_categoria ON productos (optica_id, categoria_id);
CREATE INDEX idx_servicios_categoria ON servicios (optica_id, categoria_id);

CREATE UNIQUE INDEX uq_citas_sucursal_fecha_hora_activa
  ON citas (sucursal_id, fecha_hora) WHERE estado IN ('programada', 'confirmada');