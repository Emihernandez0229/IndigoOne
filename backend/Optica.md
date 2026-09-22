# Modelo de Roles y Permisos de las Ópticas

## 1. Objetivo

El sistema de Índigo debe permitir administrar múltiples ópticas, donde cada óptica puede operar de manera independiente y, opcionalmente, contar con una o varias sucursales.

El modelo de autorización debe permitir controlar:

* Qué puede hacer cada usuario.
* Sobre qué información puede operar.
* A qué óptica pertenece.
* A qué sucursal pertenece, cuando corresponda.
* Qué información puede consultar o modificar.

Para este sistema se establecen **tres roles principales para los usuarios de las ópticas**:

1. **Dueño**
2. **Gerente**
3. **Empleado**

No se contempla inicialmente un cuarto rol. Si en el futuro aparecen nuevas necesidades, el modelo podrá extenderse mediante permisos específicos.

---

# 2. Estructura organizacional

Una óptica puede existir con o sin sucursales.

### Óptica sin sucursales

```text
Óptica
└── Dueño
```

El dueño administra directamente las operaciones de la óptica.

### Óptica con sucursales

```text
Óptica
│
├── Dueño
│
├── Sucursal Centro
│   ├── Gerente
│   └── Empleados
│
├── Sucursal Norte
│   ├── Gerente
│   └── Empleados
│
└── Sucursal Sur
    ├── Gerente
    └── Empleados
```

La existencia de una sucursal es opcional. **No se debe crear una sucursal artificial cuando una óptica no tenga sucursales.**

---

# 3. Relación entre usuarios, ópticas y sucursales

Todos los usuarios de una óptica pertenecen obligatoriamente a una óptica.

La pertenencia a una sucursal depende del rol.

| Rol      | Óptica      | Sucursal       |
| -------- | ----------- | -------------- |
| Dueño    | Obligatoria | No obligatoria |
| Gerente  | Obligatoria | Obligatoria    |
| Empleado | Obligatoria | Obligatoria    |

Esto significa que:

```text
Dueño
optica_id = obligatorio
sucursal_id = NULL
```

Mientras que:

```text
Gerente
optica_id = obligatorio
sucursal_id = obligatorio
```

y:

```text
Empleado
optica_id = obligatorio
sucursal_id = obligatorio
```

El dueño administra la óptica completa y no necesita pertenecer a una sucursal específica.

---

# 4. Roles

## 4.1 Dueño

El dueño representa al responsable de toda la óptica.

### Alcance

Su alcance es **toda la óptica**.

Si la óptica tiene varias sucursales, el dueño puede consultar y administrar la información de todas ellas.

```text
Dueño
│
├── Óptica
├── Sucursal Centro
├── Sucursal Norte
├── Sucursal Sur
├── Usuarios
├── Clientes
├── Ventas
├── Citas
├── Laboratorio
├── Inventario
└── Reportes
```

### Responsabilidades

El dueño puede:

* Administrar la información de la óptica.
* Crear y administrar sucursales.
* Crear y administrar usuarios.
* Asignar empleados y gerentes a sucursales.
* Consultar las operaciones de todas las sucursales.
* Consultar clientes.
* Administrar citas.
* Consultar y administrar ventas.
* Consultar órdenes de laboratorio.
* Administrar productos y servicios.
* Consultar y administrar inventario.
* Consultar reportes generales de la óptica.

El dueño **no está limitado por una sucursal específica**.

---

# 4.2 Gerente

El gerente representa al responsable operativo de una sucursal.

### Alcance

Su alcance está limitado a **una sucursal específica**.

```text
Óptica
│
├── Sucursal Centro
│   └── Gerente
│
├── Sucursal Norte
│   └── Gerente
│
└── Sucursal Sur
    └── Gerente
```

Un gerente de la Sucursal Centro no puede administrar directamente la información de la Sucursal Norte.

### Responsabilidades

El gerente puede:

* Consultar información de su sucursal.
* Administrar empleados de su sucursal.
* Consultar clientes de su sucursal.
* Administrar citas de su sucursal.
* Administrar ventas de su sucursal.
* Gestionar órdenes de laboratorio relacionadas con su sucursal.
* Consultar y administrar el inventario de su sucursal.
* Consultar productos y servicios disponibles.
* Consultar reportes correspondientes a su sucursal.

### Restricciones

El gerente no puede:

* Administrar la óptica completa.
* Crear o eliminar otras sucursales.
* Administrar otras sucursales.
* Modificar al dueño de la óptica.
* Administrar gerentes de otras sucursales.
* Consultar información privada de otras sucursales.

---

# 4.3 Empleado

El empleado representa al usuario operativo que realiza las actividades diarias de la óptica.

### Alcance

Su alcance está limitado a su sucursal.

```text
Óptica
└── Sucursal Centro
    ├── Gerente
    ├── Empleado
    ├── Empleado
    └── Empleado
```

### Responsabilidades

El empleado puede realizar las operaciones directamente relacionadas con la atención y venta al cliente:

* Consultar clientes.
* Registrar clientes.
* Actualizar información de clientes.
* Registrar citas.
* Consultar citas.
* Actualizar el estado de citas.
* Registrar ventas.
* Consultar ventas permitidas.
* Crear órdenes de laboratorio.
* Consultar el estado de las órdenes de laboratorio.

### Restricciones

El empleado no puede:

* Administrar usuarios.
* Crear sucursales.
* Modificar sucursales.
* Administrar la configuración de la óptica.
* Administrar gerentes.
* Administrar inventario de forma administrativa.
* Consultar información de otras sucursales.
* Consultar reportes administrativos generales.

---

# 5. Modelo de permisos

Los roles representan **quién es el usuario**, mientras que los permisos representan **qué puede hacer**.

Se recomienda manejar los permisos mediante la siguiente estructura conceptual:

```text
Rol
 │
 ▼
Permisos
 │
 ▼
Recurso + Acción
```

Por ejemplo:

```text
empleado
    │
    └── ventas.crear
```

significa que un empleado tiene permiso para crear una venta.

Los permisos pueden seguir una nomenclatura basada en:

```text
recurso.acción
```

Ejemplos:

```text
clientes.ver
clientes.crear
clientes.editar

citas.ver
citas.crear
citas.editar
citas.cancelar

ventas.ver
ventas.crear
ventas.cancelar

laboratorio.ver
laboratorio.crear
laboratorio.editar

usuarios.ver
usuarios.crear
usuarios.editar
usuarios.desactivar

sucursales.ver
sucursales.crear
sucursales.editar

inventario.ver
inventario.editar

reportes.ver
```

---

# 6. Matriz inicial de permisos

La siguiente matriz representa la propuesta inicial de permisos.

| Módulo                 | Dueño | Gerente             | Empleado          |
| ---------------------- | ----- | ------------------- | ----------------- |
| Óptica                 | CRUD  | Ver                 | No                |
| Sucursales             | CRUD  | Ver propia          | No                |
| Usuarios               | CRUD  | Gestionar empleados | No                |
| Clientes               | CRUD  | CRUD                | CRUD              |
| Citas                  | CRUD  | CRUD                | CRUD              |
| Ventas                 | CRUD  | CRUD                | Crear / consultar |
| Órdenes de laboratorio | CRUD  | CRUD                | Crear / consultar |
| Productos y servicios  | CRUD  | CRUD                | Consultar         |
| Inventario             | CRUD  | Gestionar sucursal  | Consultar         |
| Reportes               | Todas | Sucursal            | Limitados         |

**CRUD** representa:

* Create — Crear
* Read — Consultar
* Update — Actualizar
* Delete — Eliminar

Las operaciones destructivas, como cancelar ventas o eliminar información, deben definirse posteriormente de acuerdo con las reglas del negocio.

---

# 7. Rol, permiso y alcance

Es importante diferenciar tres conceptos.

## Rol

Define el tipo de usuario:

```text
dueño
gerente
empleado
```

## Permiso

Define la acción que puede realizar:

```text
ventas.crear
clientes.editar
citas.ver
```

## Alcance

Define sobre qué información puede realizar esa acción.

Ejemplo:

```text
María
│
├── Rol: empleado
├── Permiso: ventas.ver
└── Alcance: Sucursal Centro
```

Por lo tanto, María puede consultar ventas, pero únicamente las correspondientes a su sucursal.

En cambio:

```text
Carlos
│
├── Rol: dueño
├── Permiso: ventas.ver
└── Alcance: Óptica completa
```

Carlos puede consultar las ventas de todas las sucursales de su óptica.

---

# 8. Regla de aislamiento entre sucursales

Cuando una óptica tiene varias sucursales, los usuarios pertenecientes a una sucursal no deben poder acceder directamente a información de otra sucursal.

Por ejemplo:

```text
Óptica Vision
│
├── Sucursal Centro
│   ├── Juan
│   └── María
│
└── Sucursal Norte
    ├── Pedro
    └── Ana
```

María pertenece a:

```text
sucursal_id = CENTRO
```

Por lo tanto, una consulta de ventas realizada por María debe limitarse a:

```text
ventas.sucursal_id = CENTRO
```

No debe ser suficiente validar únicamente que María tenga el permiso:

```text
ventas.ver
```

También debe comprobarse el alcance.

Conceptualmente:

```text
¿Tiene el permiso?
        │
        ▼
      Sí
        │
        ▼
¿El recurso pertenece
a su alcance?
        │
    ┌───┴───┐
   Sí       No
   │         │
Permitir   Denegar
```

---

# 9. Caso especial: óptica sin sucursales

Una óptica puede comenzar sin ninguna sucursal.

Por ejemplo:

```text
Óptica Vision
└── Carlos
    └── dueño
```

Carlos puede trabajar directamente con:

```text
Clientes
Citas
Ventas
Órdenes de laboratorio
Inventario
Productos
```

No es necesario crear:

```text
Sucursal Principal
```

solamente para permitir que el sistema funcione.

La ausencia de sucursales representa correctamente que la óptica opera directamente.

---

# 10. Creación posterior de sucursales

Si posteriormente el dueño crea una sucursal:

```text
Óptica Vision
│
├── Carlos
│   └── dueño
│
└── Sucursal Centro
```

Carlos continúa siendo dueño de la óptica.

No se convierte en gerente.

Posteriormente puede crear un gerente:

```text
Óptica Vision
│
├── Carlos
│   └── dueño
│
└── Sucursal Centro
    └── Juan
        └── gerente
```

Y después agregar empleados:

```text
Óptica Vision
│
├── Carlos
│   └── dueño
│
└── Sucursal Centro
    ├── Juan
    │   └── gerente
    │
    ├── María
    │   └── empleado
    │
    └── Pedro
        └── empleado
```

---

# 11. Regla de integridad de los roles

La relación entre el rol y la sucursal debe mantenerse consistente.

Se establece:

```text
dueño
    sucursal_id = NULL

gerente
    sucursal_id = obligatorio

empleado
    sucursal_id = obligatorio
```

Esto evita situaciones incorrectas como:

```text
empleado
sucursal_id = NULL
```

o:

```text
gerente
sucursal_id = NULL
```

El dueño es el único rol que puede existir directamente asociado a la óptica sin pertenecer a una sucursal.

---

# 12. Gerente por sucursal

Cada sucursal tendrá como máximo un gerente.

La relación será:

```text
Sucursal 1 ─────── 0..1 Gerente
```

Por ejemplo:

```text
Sucursal Centro → Juan
Sucursal Norte  → Ana
Sucursal Sur    → sin gerente
```

Una sucursal puede existir temporalmente sin gerente, pero no puede tener dos gerentes simultáneamente.

La tabla `sucursal_gerentes` se utiliza para representar esta relación.

---

# 13. Principio general de autorización

Todas las operaciones realizadas por un usuario deben pasar conceptualmente por tres validaciones:

```text
1. ¿Quién es?
       ↓
2. ¿Qué puede hacer?
       ↓
3. ¿Sobre qué información puede hacerlo?
```

Ejemplo:

```text
Usuario:
María

Rol:
empleado

Permiso:
ventas.crear

Alcance:
Sucursal Centro
```

Resultado:

```text
Crear venta en Centro       → PERMITIDO
Crear venta en Norte        → DENEGADO
Crear sucursal              → DENEGADO
Modificar usuarios          → DENEGADO
```

---

# 14. Resumen del modelo

El modelo de usuarios de las ópticas queda definido de la siguiente manera:

```text
                         ÓPTICA
                           │
                           │
                    ┌──────┴──────┐
                    │             │
                  Dueño       Sucursales
                    │             │
                    │       ┌─────┴─────┐
                    │       │           │
                    │    Gerente    Empleados
                    │
                    ▼
              Toda la óptica
```

### Dueño

```text
Alcance → Toda la óptica
```

### Gerente

```text
Alcance → Una sucursal
```

### Empleado

```text
Alcance → Una sucursal
```

La arquitectura permite tanto:

```text
Óptica
└── Dueño
```

como:

```text
Óptica
├── Dueño
├── Sucursal A
│   ├── Gerente
│   └── Empleados
├── Sucursal B
│   ├── Gerente
│   └── Empleados
└── Sucursal C
    ├── Gerente
    └── Empleados
```

De esta forma, **las sucursales son opcionales**, el dueño siempre pertenece directamente a la óptica y los roles de gerente y empleado están asociados a una sucursal específica.
