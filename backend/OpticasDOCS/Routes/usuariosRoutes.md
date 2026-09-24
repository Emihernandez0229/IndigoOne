# API de Usuarios y Sucursales

## Usuarios

Base:

```http
/api/optica/usuarios
```

Todas las rutas requieren autenticación y pertenecen al tipo de usuario `optica`.

---

### POST /gerentes

```http
POST /api/optica/usuarios/gerentes
```

Crea un nuevo usuario con rol `encargado`.

### Autorización

Solo:

```text
dueno
```

### Body

```json
{
    "nombre": "Nombre del gerente"
}
```

La sucursal no se asigna durante la creación del usuario.

La relación entre el gerente y una sucursal se administra posteriormente mediante el módulo de sucursales.

---

### POST /empleados

```http
POST /api/optica/usuarios/empleados
```

Crea un nuevo usuario con rol `empleado`.

### Autorización

```text
dueno
encargado
```

El `encargado` solamente puede crear empleados para la sucursal que administra.

### Body

```json
{
    "nombre": "Nombre del empleado",
    "sucursal_id": "UUID"
}
```

El servicio valida que la sucursal:

* Pertenezca a la misma óptica.
* Exista.
* Esté activa.
* Si el creador es `encargado`, sea la sucursal que administra.

---

### GET /

```http
GET /api/optica/usuarios/
```

Obtiene usuarios de la óptica de acuerdo con el rol del usuario autenticado.

### `dueno`

Puede consultar los usuarios de toda su óptica:

```text
dueño
├── encargados
└── empleados
```

### `encargado`

Puede consultar únicamente los usuarios de la sucursal que administra.

Actualmente esto permite consultar a los empleados de dicha sucursal.

### Otros roles

```text
403 Forbidden
```

---

### GET /:id

```http
GET /api/optica/usuarios/:id
```

Obtiene un usuario específico.

### `dueno`

Puede consultar cualquier usuario perteneciente a su óptica.

### `encargado`

Puede consultar únicamente usuarios pertenecientes a la sucursal que administra.

### Validación de aislamiento

El usuario buscado siempre se filtra mediante:

```sql
WHERE id = $1
AND optica_id = $2
```

Por lo tanto, un usuario de otra óptica no puede ser consultado mediante esta ruta.

---

### PATCH /:id

```http
PATCH /api/optica/usuarios/:id
```

Actualiza información básica de un usuario.

### Campos permitidos

```json
{
    "nombre": "Nuevo nombre",
    "activo": false
}
```

Los campos son opcionales, pero debe enviarse al menos uno.

### `dueno`

Puede modificar usuarios pertenecientes a su óptica.

Esto incluye:

```text
dueno → encargado
dueno → empleado
```

### `encargado`

Puede modificar empleados pertenecientes a la sucursal que administra.

```text
encargado → empleado de su sucursal
```

No puede modificar:

```text
otro encargado
dueño
empleado de otra sucursal
```

### Campos que NO pueden modificarse mediante esta ruta

```text
rol
sucursal_id
optica_id
usuario
password_hash
dado_de_alta_por
```

Estas operaciones requieren rutas específicas porque implican reglas administrativas diferentes.

---


# Resumen de endpoints

## Usuarios

```text
POST   /api/optica/usuarios/gerentes
POST   /api/optica/usuarios/empleados
GET    /api/optica/usuarios/
GET    /api/optica/usuarios/:id
PATCH  /api/optica/usuarios/:id
```