# Cambios en el módulo Indigo (frontend)

Este documento explica, a detalle Ninguno de estos cambios toca el backend ni ninguna ruta de la API: son correcciones y limpieza del lado del frontend.

## 1. Formatos compartidos (moneda y duración) unificados en `shared/utils/format.js`

Que se hizo: Las funciones `currency()` (para mostrar precios/montos) y `formatDuration()` (para mostrar minutos como "X h Y min") estaban copiadas, con pequeñas variaciones, dentro de varios componentes de Indigo (`BranchValueList.jsx`, `InventoryTable.jsx`, `InventoryDetailPage.jsx` para `currency()`; `LabJobDetailPanel.jsx`, `LaboratoryDetailPanel.jsx`, `MermaDetailPanel.jsx` para `formatDuration()`). Se movieron las dos a `shared/utils/format.js` y cada componente ahora las importa desde ahí en vez de tener su propia copia local.

Tener la misma función copiada en varios archivos significa que un día alguien puede corregir un bug o cambiar el formato en un solo lugar y olvidar los demás, y entonces dos pantallas distintas empiezan a mostrar el mismo dato con formatos diferentes sin que nadie lo note a simple vista. Unificarlas en `shared/` garantiza que todas las pantallas que muestran una duración o un monto se vean exactamente igual, y que un cambio futuro (por ejemplo, cambiar de "h"/"min" a otro formato) se haga una sola vez.

## 2. Código muerto eliminado en `IndigoDashboard.jsx`

Qué se hizo: Se quitaron 6 líneas de un mapa `DASHBOARD_BY_ROLE` viejo que estaba comentado (dejado ahí de una versión anterior), dejando solo el mapa real que sí se usa.

## 3. Manejo de errores visible al guardar (15 formularios/acciones, en 10 archivos)

Qué se hizo: Antes, si una escritura a la API fallaba (por ejemplo, al crear un cliente, un empleado, una sucursal, o al aceptar/terminar un trabajo de laboratorio), el error quedaba atrapado internamente pero la pantalla no mostraba nada: el usuario veía que el formulario simplemente no avanzaba, sin ninguna pista de qué salió mal. Se agregó, en cada uno de estos puntos, un bloque `catch` que guarda el mensaje de error en un estado y lo muestra como texto visible cerca del botón de guardar:

- `ClientFormPage.jsx`, `PersonnelFormModal.jsx`, `EditPersonnelModal.jsx`, `BranchFormModal.jsx`, `MyBranchEditModal.jsx`, `NewJobPage.jsx`, `InventoryFormModal.jsx`, `ResetPasswordModal.jsx`: un mensaje de error por formulario.
- `LabJobDetailPanel.jsx`: un solo estado de error compartido entre sus 4 acciones (aceptar, terminar, registrar merma, agregar detalle).
- `ProfilePage.jsx`: un mensaje de error independiente para cada una de sus dos secciones (información personal y datos de contacto), porque son dos formularios que se guardan por separado.

Por qué: Un formulario que falla en silencio es, desde la perspectiva de quien lo usa, indistinguible de un sistema que no responde la persona no sabe si debe esperar, reintentar, revisar sus datos o reportarlo como un bug. Mostrar el error real (aunque sea el mensaje genérico que manda el backend) le da a quien usa el sistema la información mínima para decidir qué hacer, y evita reportes de soporte de "se congela" cuando en realidad sí hay una respuesta, solo que nadie la mostraba.

## 4. Unificación de tablas duplicadas por rol

Qué se hizo: Existían tres tablas que mostraban prácticamente la misma información pero estaban escritas como archivos separados para cada rol:

- **Clientes:** `ClientTable.jsx` (vista del Dueño, todas las sucursales) y `ManagerClientTable.jsx` (vista del Gerente, solo su sucursal) eran dos componentes casi idénticos. Se unificaron en un solo `ClientTable.jsx` con una prop `variant` (`"global"` o `"branch"`) que decide qué columnas mostrar, más las props `canEdit`/`canDeactivate` para las acciones. Se eliminó `ManagerClientTable.jsx` y se actualizó `ManagerClientsPage.jsx` para usar el componente unificado.
- **Personal/usuarios:** `UserTable.jsx` (Dueño), `ManagerEmployeeTable.jsx` (Gerente/Subgerente) y `PersonalTable.jsx` (Super usuario) eran tres copias del mismo concepto. Se unificaron en un solo `UserTable.jsx` con las props `showBranchColumn`, `canEdit`, `canDeactivate` y `restrictDeactivateToRole`, y se eliminaron `ManagerEmployeeTable.jsx` y `PersonalTable.jsx`. Se actualizaron `UsersPage.jsx`, `ManagerEmployeesPage.jsx` y `SuperUserPersonalPage.jsx` para usar la tabla unificada con las props que corresponden a cada rol.

Tener tres tablas casi iguales significa que cualquier mejora o corrección (un ajuste de columna, un ícono nuevo, un bug en el orden de las acciones) hay que recordarla y aplicarla en las tres por separadomy es fácil que alguna se quede desactualizada. Con una sola tabla controlada por props, un cambio se hace una vez y se refleja automáticamente en los tres roles que la usan, igual que ya se hacía con la mayoría de los demás componentes compartidos del proyecto.
