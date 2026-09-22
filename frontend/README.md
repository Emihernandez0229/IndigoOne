# React + Vite
LO QUE YA ESTA HECHO

1. INVENTARIO TANTO PARA INDIgO COMO PARA OPTICAS 
2. QUE BACK CHEQUE LOS FILTRO PARA ESO DE LOS PERMISOS QUE CADA ROL LES SALGA LA INFORMACION CORRECTA YA QUE TENGO UN BACK CON DATOS FALSOS QUE APUNTA AL 4001 PARA QUE PUEDAN VISUALIZAR. PERO A LOS JEFES DE SUCURSAL Y VENTAS LES SALE EL INVENTARIO DE OTRAS SUCURSALES




 # Modelo de Roles y Permisos de las Ópticas V.1.0.0


# 1. Roles

## 1.1 Dueño

El dueño es el responsable de la administración completa de la óptica.

### Alcance

El dueño tiene acceso a **toda la óptica y todas sus sucursales**.

```text
Óptica

- Sucursal Centro
- Sucursal Norte
- Sucursal Sur
```

El dueño puede consultar y administrar información de cualquiera de las sucursales pertenecientes a su óptica.

### Permisos

El dueño puede:

* Administrar información de la óptica.
* Crear, modificar y desactivar sucursales.
* Crear y administrar usuarios.
* Asignar usuarios a sucursales.
* Asignar roles a usuarios.
* Consultar clientes de cualquier sucursal.
* Administrar expedientes.
* Administrar citas.
* Consultar y administrar ventas.
* Administrar productos y servicios.
* Consultar y administrar inventario.
* Crear y gestionar órdenes de laboratorio.
* Consultar el historial de órdenes de laboratorio.
* Consultar reportes de toda la óptica.

### Restricciones

El dueño no tiene restricciones de sucursal dentro de su propia óptica.

Su alcance es:

```text
Dueño

- Toda la óptica
```

---

# 1.2 Gerente

El gerente es responsable de la administración y operación de una sucursal específica.

### Alcance

El gerente solamente puede acceder a la información correspondiente a la sucursal a la que está asignado.

```text
Óptica

- Sucursal Centro
  - Gerente

- Sucursal Norte
  - Gerente

- Sucursal Sur
  - Gerente
```

Un gerente de la Sucursal Centro no puede administrar directamente la información de la Sucursal Norte.

### Permisos

El gerente puede:

* Consultar información de su sucursal.
* Consultar y administrar empleados de su sucursal.
* Consultar clientes de su sucursal.
* Crear y modificar expedientes.
* Crear, consultar, modificar y cancelar citas.
* Crear y consultar ventas.
* Cancelar ventas cuando las reglas del negocio lo permitan.
* Administrar productos y servicios de su sucursal.
* Consultar y administrar el inventario de su sucursal.
* Crear y gestionar órdenes de laboratorio de su sucursal.
* Consultar el historial de órdenes de laboratorio.
* Consultar reportes correspondientes a su sucursal.

### Restricciones

El gerente no puede:

* Administrar la óptica completa.
* Crear o eliminar sucursales.
* Administrar otras sucursales.
* Administrar al dueño.
* Administrar gerentes de otras sucursales.
* Consultar información de otras sucursales.
* Modificar configuraciones generales de la óptica.



# 1.3 Empleado

El empleado es un usuario operativo encargado principalmente de las actividades relacionadas con clientes, citas, ventas y órdenes de laboratorio.

### Alcance

El empleado solamente puede operar sobre la sucursal a la que pertenece.

```text
Óptica

- Sucursal Centro
  - Gerente
  - Empleado
  - Empleado
  - Empleado
```

### Permisos

El empleado puede:

#### Clientes

* Registrar clientes.
* Consultar clientes.
* Modificar información de clientes.

#### Expedientes

* Registrar expedientes.
* Consultar expedientes.
* Registrar nuevos exámenes.
* Consultar información necesaria para la atención del cliente.

#### Citas

* Crear citas.
* Consultar citas.
* Modificar citas.
* Cancelar citas.
* Actualizar el estado de una cita.

#### Ventas

* Crear ventas.
* Consultar ventas permitidas.
* Registrar productos y servicios en una venta.

#### Órdenes de laboratorio

* Crear órdenes de laboratorio.
* Consultar órdenes de laboratorio.
* Consultar el estado de las órdenes.
* Agregar información permitida a las órdenes.

### Restricciones

El empleado no puede:

* Administrar usuarios.
* Crear o modificar sucursales.
* Administrar otros empleados.
* Administrar gerentes.
* Modificar la configuración de la óptica.
* Administrar productos y servicios.
* Administrar inventario.
* Consultar información de otras sucursales.
* Consultar reportes administrativos generales.


PENDIENTES POR HACER-------------------------------------------------------------------------------------------------------------------------
OPTICAS
 1. PACIENTES
 2. CITAS
 3. CONSULTAS
 4. VENTAS
 




INDIGO

 2. (con ventas, no es literal ventas, al menos por ahora no, lo unico que haran ellos seran registrar trabajos a bicel, pero eso dejalo al final, indigo dejalo al final, ayuda a leo a hacer sus vistas ajjaja, namas arregla lo que te pedi de usuasrios y susucrsales de indigo)
