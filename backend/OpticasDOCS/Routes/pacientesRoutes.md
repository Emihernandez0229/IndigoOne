# Rutas de pacientes

**Ruta base:**

```text
/api/optica/pacientes
```

Todas las rutas requieren autenticación y están disponibles únicamente para usuarios de tipo `optica` con alguno de los siguientes roles:

* `dueno`
* `encargado`
* `empleado`



## Permisos por rol

| Operación           | Dueño                           | Encargado                | Empleado                 |
| ------------------- | ------------------------------- | ------------------------ | ------------------------ |
| Crear paciente      | Cualquier sucursal de su óptica | Su sucursal administrada | Su sucursal asignada     |
| Listar pacientes    | Cualquier sucursal de su óptica | Su sucursal administrada | Su sucursal asignada     |
| Obtener paciente    | Cualquier paciente de su óptica | Pacientes de su sucursal | Pacientes de su sucursal |
| Actualizar paciente | Cualquier paciente de su óptica | Pacientes de su sucursal | Pacientes de su sucursal |

> El `sucursalId` proporcionado por el cliente nunca se utiliza para ampliar los permisos de `encargado` o `empleado`. El servicio verifica que la sucursal solicitada corresponda al alcance del usuario autenticado.

---

# Crear paciente

```http
POST /api/optica/pacientes
```

Crea un paciente dentro de una sucursal.

### Permisos

* `dueno`: puede elegir cualquier sucursal perteneciente a su óptica.
* `encargado`: el paciente se crea automáticamente en la sucursal que administra.
* `empleado`: el paciente se crea automáticamente en la sucursal que tiene asignada.

### Body para `dueno`

```json
{
    "sucursalId": "9754c66b-74f9-427d-b1e0-d3173dca303b",
    "nombre": "Juan Pérez",
    "telefono": "9621234567",
    "email": "juan@example.com",
    "fechaNacimiento": "1995-05-20"
}
```

### Body para `encargado` o `empleado`

El `sucursalId` no es necesario, ya que la sucursal se determina mediante el usuario autenticado.

```json
{
    "nombre": "Juan Pérez",
    "telefono": "9621234567",
    "email": "juan@example.com",
    "fechaNacimiento": "1995-05-20"
}
```

### Campos

| Campo             | Tipo        |  Obligatorio | Descripción                              |
| ----------------- | ----------- | -----------: | ---------------------------------------- |
| `sucursalId`      | UUID        | Solo `dueno` | Sucursal donde se registrará el paciente |
| `nombre`          | string      |           Sí | Nombre del paciente                      |
| `telefono`        | string/null |           No | Teléfono del paciente                    |
| `email`           | string/null |           No | Correo electrónico                       |
| `fechaNacimiento` | date/null   |           No | Fecha de nacimiento                      |

### Respuesta `201 Created`

```json
{
    "ok": true,
    "paciente": {
        "id": "uuid",
        "sucursal_id": "uuid",
        "nombre": "Juan Pérez",
        "telefono": "9621234567",
        "email": "juan@example.com",
        "fecha_nacimiento": "1995-05-20",
        "created_at": "2026-09-18T22:00:00.000Z",
        "updated_at": "2026-09-18T22:00:00.000Z"
    }
}
```

---

# Obtener pacientes de una sucursal

```http
GET /api/optica/pacientes/sucursal/:sucursalId
```

Obtiene todos los pacientes registrados en una sucursal a la que el usuario tiene acceso.

### Parámetro

| Parámetro    | Tipo | Descripción       |
| ------------ | ---- | ----------------- |
| `sucursalId` | UUID | ID de la sucursal |

### Permisos

**Dueño**

Puede consultar cualquier sucursal que pertenezca a su óptica.

**Encargado**

Solo puede consultar la sucursal que administra.

**Empleado**

Solo puede consultar la sucursal que tiene asignada.

### Ejemplo

```http
GET /api/optica/pacientes/sucursal/9754c66b-74f9-427d-b1e0-d3173dca303b
```

### Respuesta `200 OK`

```json
{
    "ok": true,
    "pacientes": [
        {
            "id": "uuid",
            "sucursal_id": "uuid",
            "nombre": "Juan Pérez",
            "telefono": "9621234567",
            "email": "juan@example.com",
            "fecha_nacimiento": "1995-05-20",
            "created_at": "2026-09-18T22:00:00.000Z",
            "updated_at": "2026-09-18T22:00:00.000Z"
        }
    ]
}
```

---

# Obtener paciente por ID

```http
GET /api/optica/pacientes/:id
```

Obtiene un paciente específico verificando que pertenezca al alcance permitido del usuario.

### Parámetro

| Parámetro | Tipo | Descripción     |
| --------- | ---- | --------------- |
| `id`      | UUID | ID del paciente |

### Permisos

* `dueno`: puede consultar pacientes de cualquier sucursal de su óptica.
* `encargado`: solo pacientes de la sucursal que administra.
* `empleado`: solo pacientes de su sucursal asignada.

### Ejemplo

```http
GET /api/optica/pacientes/0fe4d741-a9e8-4a33-9a58-7eba3006e0cb
```

### Respuesta `200 OK`

```json
{
    "ok": true,
    "paciente": {
        "id": "0fe4d741-a9e8-4a33-9a58-7eba3006e0cb",
        "sucursal_id": "9754c66b-74f9-427d-b1e0-d3173dca303b",
        "nombre": "Juan Pérez",
        "telefono": "9621234567",
        "email": "juan@example.com",
        "fecha_nacimiento": "1995-05-20",
        "created_at": "2026-09-18T22:00:00.000Z",
        "updated_at": "2026-09-18T22:00:00.000Z"
    }
}
```

---

# Actualizar paciente

```http
PATCH /api/optica/pacientes/:id
```

Actualiza uno o varios datos permitidos de un paciente existente.

### Permisos

* `dueno`: puede actualizar cualquier paciente perteneciente a su óptica.
* `encargado`: puede actualizar pacientes de la sucursal que administra.
* `empleado`: puede actualizar pacientes de su sucursal asignada.

### Importante

El `sucursalId` **no se envía en esta petición**.

La sucursal del paciente ya está almacenada en `clientes_finales.sucursal_id` y el servicio utiliza esa información para determinar el alcance de la actualización.

### Body

Se puede enviar uno o varios de los siguientes campos:

```json
{
    "nombre": "Juan Pérez García",
    "telefono": "9629876543",
    "email": "juan.garcia@example.com",
    "fechaNacimiento": "1995-05-20"
}
```

### Campos

| Campo             | Tipo        | Obligatorio | Descripción               |
| ----------------- | ----------- | ----------: | ------------------------- |
| `nombre`          | string      |          No | Nuevo nombre              |
| `telefono`        | string/null |          No | Nuevo teléfono            |
| `email`           | string/null |          No | Nuevo correo              |
| `fechaNacimiento` | date/null   |          No | Nueva fecha de nacimiento |

Debe enviarse al menos un campo.

### Ejemplo

```http
PATCH /api/optica/pacientes/0fe4d741-a9e8-4a33-9a58-7eba3006e0cb
```

```json
{
    "telefono": "9629876543"
}
```

### Respuesta `200 OK`

```json
{
    "ok": true,
    "paciente": {
        "id": "0fe4d741-a9e8-4a33-9a58-7eba3006e0cb",
        "sucursal_id": "9754c66b-74f9-427d-b1e0-d3173dca303b",
        "nombre": "Juan Pérez",
        "telefono": "9629876543",
        "email": "juan@example.com",
        "fecha_nacimiento": "1995-05-20",
        "created_at": "2026-09-18T22:00:00.000Z",
        "updated_at": "2026-09-18T22:15:00.000Z"
    }
}
```

---

# Errores comunes

### `400 Bad Request`

Cuando falta un dato obligatorio, por ejemplo:

```json
{
    "error": "El ID del paciente es obligatorio"
}
```

### `403 Forbidden`

Cuando el usuario no tiene acceso a la sucursal o no tiene una sucursal asignada:

```json
{
    "error": "No tienes permisos para acceder a esta sucursal"
}
```

### `404 Not Found`

Cuando el paciente o la sucursal no pertenecen al alcance permitido:

```json
{
    "error": "Paciente no encontrado"
}
```

### `422 Unprocessable Entity`

Cuando los datos enviados no cumplen el esquema de validación:

```json
{
    "error": "Los datos proporcionados no son válidos"
}
```
