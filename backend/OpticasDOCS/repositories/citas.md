# CitasRepository

El `CitasRepository` es responsable de gestionar el acceso a los datos relacionados con las citas (`citas`) en PostgreSQL.

Su responsabilidad se limita a la **persistencia y consulta de datos**. No debe contener reglas de negocio, autorización, validaciones propias del flujo de la aplicación ni lógica relacionada con HTTP.

La comunicación con PostgreSQL se realiza mediante el objeto `pool` proporcionado por `pg`.

---

## Responsabilidad

El repository proporciona operaciones para:

* Crear una cita.
* Obtener todas las citas de una sucursal.
* Obtener una cita específica.
* Obtener las citas de un cliente.
* Obtener las citas de un día determinado.
* Obtener citas según su estado.
* Actualizar los datos de una cita.
* Actualizar el estado de una cita.

Las consultas utilizan parámetros (`$1`, `$2`, etc.) para evitar interpolar directamente valores dentro de las sentencias SQL.

---

## Alcance de las consultas

Las operaciones de acceso a citas utilizan `sucursal_id` como parte del criterio cuando corresponde.

Esto permite mantener el aislamiento de información entre sucursales.

Por ejemplo, para obtener una cita específica se utiliza:

```sql
WHERE id = $1
AND sucursal_id = $2
```

Por lo tanto, conocer únicamente el identificador de una cita no permite recuperar una cita perteneciente a otra sucursal mediante este repository.

Este criterio también se aplica a las consultas por cliente, estado y a las consultas generales de una sucursal.

---

# Métodos

## `crearCita()`

Crea una nueva cita.

### Parámetros

```text
sucursalId
clienteId
fechaHora
motivo
creadoPor
```

El estado inicial no se proporciona como parámetro.

La tabla `citas` define:

```sql
estado VARCHAR(20) DEFAULT 'programada'
```

por lo que PostgreSQL asigna automáticamente el estado `programada` al crear una cita.

De esta manera, el estado inicial no puede ser seleccionado arbitrariamente por quien invoque directamente el método.

### Resultado

Devuelve la cita creada mediante `RETURNING`.

Si la operación no produce un registro, el resultado será `undefined`.

La interpretación de este resultado y la generación de errores de dominio corresponden al Service.

---

## `obtenerTodasCitas()`

Obtiene todas las citas pertenecientes a una sucursal.

Las citas se ordenan por `fecha_hora` ascendente:

```sql
ORDER BY fecha_hora ASC
```

Esto permite obtenerlas en orden cronológico.

### Parámetros

```text
sucursalId
```

### Resultado

Devuelve un arreglo con las citas encontradas.

Si no existen citas para la sucursal, devuelve un arreglo vacío.

---

## `obtenerCitaPorId()`

Obtiene una cita específica.

La consulta utiliza tanto el identificador de la cita como el identificador de la sucursal:

```sql
WHERE id = $1
AND sucursal_id = $2
```

Esto evita recuperar mediante este método una cita que pertenezca a otra sucursal.

### Parámetros

```text
sucursalId
citaId
```

### Resultado

Devuelve la cita encontrada o `undefined` si no existe una cita que coincida con ambos identificadores.

La conversión de `undefined` a un error como `NotFoundError` corresponde al Service.

---

## `obtenerCitasPorCliente()`

Obtiene las citas asociadas a un cliente dentro de una sucursal específica.

La consulta utiliza:

```sql
WHERE cliente_final_id = $1
AND sucursal_id = $2
```

Las citas se ordenan de forma descendente por `fecha_hora`, mostrando primero las citas más recientes.

### Parámetros

```text
clienteId
sucursalId
```

### Resultado

Devuelve un arreglo de citas.

Si no existen coincidencias, devuelve un arreglo vacío.

---

## `obtenerCitasPorDia()`

Obtiene las citas de una sucursal correspondientes a un día determinado.

La consulta utiliza un intervalo semiabierto:

```sql
fecha_hora >= $2
AND fecha_hora < $2 + INTERVAL '1 day'
```

La utilización de `>=` para el inicio y `<` para el siguiente día evita problemas con valores correspondientes exactamente a la medianoche del día siguiente.

Por ejemplo, para el día:

```text
2026-09-10
```

se considera el intervalo:

```text
2026-09-10 00:00:00
        ≤ fecha_hora <
2026-09-11 00:00:00
```

### Parámetros

```text
sucursalId
fecha
```

### Consideración sobre zona horaria

La columna `fecha_hora` utiliza:

```sql
TIMESTAMPTZ
```

Por lo tanto, posteriormente deberá definirse y documentarse una política clara para interpretar `fecha` y determinar qué zona horaria representa el inicio y final del día.

Esto no constituye actualmente un error de la consulta; es una decisión pendiente relacionada con el manejo de fechas y zonas horarias.

---

## `obtenerCitasPorEstado()`

Obtiene las citas de una sucursal que tienen un estado determinado.

La consulta utiliza:

```sql
WHERE sucursal_id = $1
AND estado = $2
```

Los estados permitidos actualmente están definidos por la restricción `CHECK` de la tabla:

```text
programada
confirmada
atendida
cancelada
no_asistio
```

### Parámetros

```text
sucursalId
estado
```

### Resultado

Devuelve un arreglo con las citas encontradas.

Si no existen coincidencias, devuelve un arreglo vacío.

---

## `actualizarCita()`

Actualiza los datos modificables de una cita.

Actualmente permite modificar:

* `fecha_hora`
* `motivo`

La consulta utiliza `COALESCE`:

```sql
SET fecha_hora = COALESCE($3, fecha_hora),
    motivo = COALESCE($4, motivo)
```

Esto permite realizar una actualización parcial.

Si uno de los valores recibidos es `NULL`, se conserva el valor existente.

La actualización se limita además mediante:

```sql
WHERE id = $1
AND sucursal_id = $2
```

por lo que la operación queda asociada a la sucursal correspondiente.

### Parámetros

```text
citaId
sucursalId
fechaHora
motivo
```

### Resultado

Devuelve la cita actualizada o `undefined` si no existe una cita que coincida con el identificador y la sucursal proporcionados.

---

## `actualizarEstadoCita()`

Actualiza el estado de una cita.

La operación está limitada por:

```sql
WHERE id = $1
AND sucursal_id = $2
```

El valor del estado está protegido a nivel de base de datos mediante el `CHECK` definido en la tabla `citas`.

### Parámetros

```text
citaId
sucursalId
estado
```

### Resultado

Devuelve el identificador de la cita y su nuevo estado, o `undefined` si no existe una cita que coincida con el identificador y la sucursal.

---

# Manejo de resultados

El repository no transforma la ausencia de registros en errores de dominio.

Para operaciones individuales:

```js
return rows[0];
```

puede producir:

```js
undefined
```

cuando PostgreSQL no encuentra un registro.

La responsabilidad de interpretar ese resultado corresponde al Service.

Por ejemplo:

```text
Repository
    ↓
undefined
    ↓
Service
    ↓
NotFoundError
```

Esto permite mantener separadas las responsabilidades entre acceso a datos y lógica de negocio.

En operaciones que pueden devolver múltiples registros, como `obtenerTodasCitas()` u `obtenerCitasPorCliente()`, se devuelve un arreglo. Cuando no existen resultados, el arreglo estará vacío.

---

# Estados de las citas

Los valores permitidos actualmente son:

```text
programada
confirmada
atendida
cancelada
no_asistio
```

La base de datos garantiza que solamente se almacenen valores pertenecientes a este conjunto mediante un `CHECK`.

Sin embargo, el `CHECK` solamente valida que el nuevo estado sea válido individualmente.

No determina si una transición entre estados está permitida.

Por ejemplo, la regla:

```text
programada → confirmada
```

o:

```text
confirmada → atendida
```

corresponde a una regla de negocio y deberá ser validada posteriormente en el Service.

El Repository únicamente realiza la actualización solicitada.

---

# Integridad entre sucursal, cliente y usuario

Existe una consideración de integridad que actualmente **no está completamente resuelta**.

La tabla `citas` contiene:

```text
sucursal_id
cliente_final_id
creado_por
```

y cada uno posee una referencia (`FOREIGN KEY`) hacia su tabla correspondiente.

Sin embargo, las FK actuales garantizan únicamente que los registros referenciados existan.

No garantizan por sí mismas que:

```text
citas.sucursal_id
        ↓
sea la misma sucursal a la que pertenece
        ↓
clientes_finales.sucursal_id
```

Por ejemplo, actualmente la base de datos podría aceptar conceptualmente:

```text
Cita
    sucursal_id → Sucursal A
    cliente_id  → Cliente de Sucursal B
```

si ambos registros existen.

Esto representa una posible inconsistencia de datos.

## Solución prevista: Defense in Depth

Este problema se manejará posteriormente mediante una estrategia de **Defense in Depth**, utilizando más de una capa de protección.

### Primera capa: Service

El `CitasService` deberá validar las reglas de negocio antes de solicitar la creación de la cita.

Entre ellas:

```text
¿El cliente existe?
¿El cliente pertenece a la sucursal?
¿El usuario puede realizar la operación en esa sucursal?
```

Estas validaciones permiten proporcionar errores claros y mantener las reglas de negocio fuera del Repository.

### Segunda capa: SQL / PostgreSQL

Además de la validación realizada por el Service, se podrá incorporar una validación adicional en la operación SQL de creación.

El objetivo será evitar que se inserte una cita si la combinación:

```text
sucursal_id + cliente_final_id
```

no corresponde a una relación válida.

De esta manera, el sistema tendrá una segunda barrera de protección en caso de que una operación llegue al Repository con datos inconsistentes.

Conceptualmente:

```text
Controller
    ↓
CitasService
    │
    ├── Validación de reglas de negocio
    ├── Validación de sucursal / cliente
    └── Validación de autorización
    ↓
CitasRepository
    ↓
SQL
    │
    └── Segunda validación de integridad
    ↓
PostgreSQL
```

Esta estrategia se implementará cuando se desarrolle el `CitasService` y se determine la forma adecuada de reforzar la integridad a nivel SQL.

**No se considera necesario modificar el Repository actual hasta abordar esta implementación.**

---

# Consideraciones pendientes

Las siguientes cuestiones quedan identificadas para etapas posteriores:

* Definir la política de zona horaria para las consultas por día.
* Implementar las reglas de transición de estados en el Service.
* Implementar la validación de pertenencia entre cliente y sucursal.
* Definir cómo se validará el acceso de usuarios a sucursales, considerando que ciertos roles pueden operar sobre más de una sucursal.
* Reforzar la integridad de `sucursal_id` y `cliente_final_id` mediante SQL/BD como segunda capa de protección.
* Evaluar índices específicos para las consultas más utilizadas, especialmente las consultas por sucursal y fecha.

Estas consideraciones no requieren modificar actualmente las consultas del `CitasRepository`.
