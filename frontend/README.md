Ya termine el frontend de Sucursales y Personal de Indigo (vista del Dueño). Esto es lo que incluye cada uno:

Sucursales

Listado con búsqueda, filtro por estado y paginación de 10 en 10.
Alta de sucursal: nombre, responsable (solo se listan gerentes realmente disponibles, sin opción de "sin asignar") y ubicación en cascada País, Estado, Municipio.
Detalle en panel lateral con pestañas "Información general" / "Personal", datos de responsables y KPIs resumen.
Dar de alta / dar de baja con confirmación.
Personal (antes "Usuarios")

Lista solo al personal de sucursal (gerentes, subgerentes, ventas, laboratorio)
Es de solo consulta: se quitó la creación/edición desde aquí.
Dar de baja / dar de alta solo aplica a Gerentes de sucursal; los demás roles son de solo lectura.
Detalle en panel lateral: información personal, sucursal asignada, acciones administrativas.
Todo esto corre hoy contra datos de prueba en el mock-backend 4001. 