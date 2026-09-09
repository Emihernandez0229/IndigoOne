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


CREATE TABLE expedientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_final_id UUID NOT NULL REFERENCES clientes_finales(id),
    fecha_examen DATE NOT NULL,
    od_esfera NUMERIC(4,2), od_cilindro NUMERIC(4,2), od_eje INTEGER, od_adicion NUMERIC(4,2),
    oi_esfera NUMERIC(4,2), oi_cilindro NUMERIC(4,2), oi_eje INTEGER, oi_adicion NUMERIC(4,2),
    dip NUMERIC(4,1),
    observaciones TEXT,
    registrado_por UUID REFERENCES optica_usuarios(id),
    created_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE productos_servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('producto', 'servicio')),
    nombre VARCHAR(150) NOT NULL,
    precio NUMERIC(10,2) NOT NULL,
    inventario_item_id UUID REFERENCES inventario_items(id),
    stock_local INTEGER,
    activo BOOLEAN DEFAULT TRUE,
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
    expediente_id UUID REFERENCES expedientes(id),
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
CREATE INDEX idx_expedientes_cliente ON expedientes(cliente_final_id);
CREATE INDEX idx_ventas_sucursal ON ventas(sucursal_id);
CREATE INDEX idx_citas_sucursal ON citas(sucursal_id);
CREATE INDEX idx_citas_fecha ON citas(fecha_hora);
CREATE INDEX idx_ordenes_lab_sucursal ON ordenes_laboratorio(sucursal_id);
CREATE INDEX idx_ordenes_lab_estado ON ordenes_laboratorio(estado);
CREATE INDEX idx_ordenes_historial_orden ON ordenes_historial(orden_id);
CREATE INDEX idx_inventario_existencias_item ON inventario_existencias(item_id);