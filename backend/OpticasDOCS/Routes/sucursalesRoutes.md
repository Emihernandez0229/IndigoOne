# API de Usuarios 


# Sucursales

Base:

```http
/api/optica/sucursales
```

Las rutas están restringidas actualmente al rol:

```text
dueno
```

---

### GET /gerentes-disponibles

```http
GET /api/optica/sucursales/gerentes-disponibles
```

Obtiene los usuarios que pueden ser asignados como gerentes de una sucursal.

Su finalidad es proporcionar los candidatos disponibles para una asignación.

---

### GET /

```http
GET /api/optica/sucursales/
```

Obtiene las sucursales pertenecientes a la óptica del usuario autenticado.

No se utiliza un `optica_id` enviado por el cliente.

La óptica se obtiene del contexto de autenticación:

```text
req.user.optica_id
```

---

### POST /gerente

```http
POST /api/optica/sucursales/gerente
```

Asigna un gerente a una sucursal.

La operación crea la relación correspondiente en:

```text
sucursal_gerentes
```

Conceptualmente:

```text
encargado
    ↓
sucursal_gerentes
    ↓
sucursal
```

Solo puede realizarla el `dueno`.

---

### POST /

```http
POST /api/optica/sucursales/
```

Crea una nueva sucursal perteneciente a la óptica autenticada.

### Autorización

```text
dueno
```

Los datos son validados mediante:

```text
crearSucursalSchema
```

---

### GET /:id

```http
GET /api/optica/sucursales/:id
```

Obtiene una sucursal específica.

La sucursal debe pertenecer a la óptica autenticada.

Solo puede realizarla el `dueno`.

---

### PATCH /:id

```http
PATCH /api/optica/sucursales/:id
```

Actualiza los datos modificables de una sucursal.

Los campos permitidos están determinados por:

```text
actualizarSucursalSchema
```

Solo puede realizarla el `dueno`.

---

### PATCH /:id/desactivar

```http
PATCH /api/optica/sucursales/:id/desactivar
```

Desactiva una sucursal.

No elimina el registro de la base de datos.

El objetivo es conservar la información histórica relacionada con la sucursal.

Solo puede realizarla el `dueno`.

---

### PATCH /:id/activar

```http
PATCH /api/optica/sucursales/:id/activar
```

Reactiva una sucursal previamente desactivada.

Solo puede realizarla el `dueno`.

---

### PATCH /:id/gerente

```http
PATCH /api/optica/sucursales/:id/gerente
```

Cambia el gerente asignado a una sucursal.

Se utiliza cuando la sucursal ya tiene una asignación y se desea sustituirla.

El nuevo gerente debe cumplir las reglas establecidas por `cambiarGerenteSchema` y el servicio correspondiente.

Solo puede realizarla el `dueno`.

---

# Resumen de endpoints


```

## Sucursales

```text
GET    /api/optica/sucursales/gerentes-disponibles
GET    /api/optica/sucursales/
POST   /api/optica/sucursales/gerente
POST   /api/optica/sucursales/
GET    /api/optica/sucursales/:id
PATCH  /api/optica/sucursales/:id
PATCH  /api/optica/sucursales/:id/desactivar
PATCH  /api/optica/sucursales/:id/activar
PATCH  /api/optica/sucursales/:id/gerente
```