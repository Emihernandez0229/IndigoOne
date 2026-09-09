# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


1. Explicación para el backend
Contexto: el frontend está hecho con datos simulados (mocks). Toda la lógica de red está aislada en archivos services/-.js. Para conectar, el backend solo necesita que  cambie el cuerpo de esas funciones; el resto (UI, permisos, filtros, rutas) no se toca.

1.1 Login
POST /auth/login con body { username, password } → debe responder:


{
  "token": "...",
  "user": {
    "id": 1,
    "name": "Ana Ramírez",
    "username": "aramirez",
    "role": "INDIGO_BRANCH_MANAGER",
    "branch": { "id": 1, "name": "Sucursal Centro" },
    "branchIds": [1, 2],
    "permissions": ["branch.view", "user.view", "..."]
  }
}
role: string. Los valores válidos están en frontend/src/shared/security/roles.js (7 roles): INDIGO_OWNER, INDIGO_BRANCH_MANAGER, INDIGO_SALES, INDIGO_LAB, OPTICA_OWNER, OPTICA_BRANCH_MANAGER, OPTICA_EMPLOYEE. Deben coincidir EXACTAMENTE (mayúsculas, sin acentos).
permissions: array de strings. El catálogo de referencia (qué permisos lleva cada rol) está en frontend/src/shared/security/permissions.js. El front NO der permisos del rol, usa tal cual el array q
branchIds: array de ids de sucursal que el usuario puede ver. null = todas (dueño Indigo). El front filtra las listas con esto (dataScope.js), pero el backend también debe filtrar por seguridad.
token: se guarda en localStorage bajo la clave indigo_one.session. Hay un helper getToken() en authService.js. Todavía no existe un cliente HTTP con Authorization:— eso se agrega al conectar.

1.2 Endpoints que el frontend espera

Pantalla	Archivo service	Endpoints
Dashboard Indigo	indigo/dashboard/services/dashboardService.js	GET /indigo/dashboard 
Dashboard Ópticas	opticas/dashboard/services/dashboardService.js	GET /opticas/dashboard
Sucursales	indigo/branches/services/branchService.js	GET /indigo/branches
Usuarios	indigo/users/services/userService.js	GET /indigo/users

Los mocks de cada archivo muestran la forma exacta del JSON que espera cada pantalla (nombres de campos, tipos). "Dar de baja" = cambiar status a "inactive", nunca borrar el registro.

1.3 Notas
Reglas de alcance por rol que el backend debe hacer cumplir:
Dueño Indigo: ve y edita todas las sucursales y todos los usuarios.
Jefe de sucursal: ve solo sus sucursales (branchIds); en Usuarios ve solo los de sus sucursales.
Ventas / Laboratorio: sin acceso a Sucursales ni Usuarios.



--------------------------------------------------------------------------------------------
Primero que nada ti amooo muchooo



Para que pueda ingresar debido a que solo se puede iniciar sesion no te puedes registrar, para eso solamente funcionara una vez pero podras crear un super usuario desde postman, ese para crearlo lo deje en el readme que esta fuera de front,back y database, ahi esta el como puedes crear un super usaurio, al igual que la base de datos, asi que ten a la mano tu contraseña de tu postgres, tendras que entrar a la terminar de git bash, no desde el cmd,solo te funcionara si lo haces desde git bash

solo el primer superusuario podra tener su contraseña y su usuario que el quiera, la puedes cambiar,pero cuando creas a un dueño por ejemplo en tu tabla que tienes abajo, te aparecera un usuario, ese usuario pues sera tu usuario al igual que tu contrseña, despues el de la cuenta puede cambiar ese usuario y contrseña, eso aplica para todos los usuarios

con tu dashboard no toque mucho, solo toque services en el que tenias dashboardService y toque indigoDashboard,pero solo lo comente, asi que no toque mucho en esa parte.

a tu auth no le toque nada, a lo unico que le movi fue a shared/security y a shared/services y cree una nueva llamada api con el que se comunicara con el back,pero ahi no tocaras nada porque ya se iniciar sesion, a menos de ser necesario muevelo

ahora con tu sucursales/branches aqui si movi y aqui es donde tendras que mover
en detalle sucursal se puede ver pues al gerente,pero se mira diferente al resto de la informacion, si entras a esa parte lo veras por ti misma, asi que no te especifico tanto, bueno eso por un lado, otra cosa es al dar de baja a una sucursal , no tiene que ser tan facil el darle de baja, asi que le pregunte si esta seguro o algo asi, y cuando diga que si por ejemplo que en lugar de ese icono de prohubido o algo asi, sea otro para volver a ponerlo en activo, 

ahora en usuarios, arregla algo q no hice ajajja, que es que al registrar un nuevo usuario, un nuevo empleado, es que si no he puesto nombre ni rol y seleccionas susursal primero aparecen todas las sucursales,si seleccionas el rol de gerente pues ya no te muestra todas,solo te mostrara las sucursales que no tengan un gerente de susucrsal, pero puedes agregar una nueva susucrsal desde ahi mismo por si no hubiera una disponible, ya si el usuario que van a registrar es de ventas pues ya aparecen todas las sucursales, pero esto solo le aparece al dueño, a el si le van a apareer todas las sucursales, a un gerente de susucrsal no le debe de aparecer en que sucursal lo quiere poner, porque solo debe de estar a cargo de su sucursal, y solo le aparece su sucursal, pero pues es innecesario,asi que en la vista del gerente al momento de registrar un empelado ya sea de ventas o de laboratorio que no pida la sucursal, solo al gerente, al dueño si,

en el modulo de sucursales que se le muestra a un gerente no me termina de convencer, porque no se le muestra nada que no se le muestre en usuarios, porque le aparece que tiene una sucursal,pero y luego?, en usuarios tambien se le muestra cuantos tiene a su cargo, entonces asi o solo ponle susursal, porque debe de poner la direccion y el numero de telefono de la susucrsal asi que en acciones ponle que pueda editar su sucursal y no se como quieras ordenar tu vista para el gerente en esa parte de sucursal

ahhh si, no que cosa movi, pero por alguna razon, no se porque, pero cuando inicio sesion pues quiero entrar a otra cuenta,pues ya no me deja aunque pare el front,asiq  ahi te lo encargo


con ventas, no es literal ventas, al menos por ahora no, lo unico que haran ellos seran registrar trabajos a bicel, pero eso dejalo al final, indigo dejalo al final, ayuda a leo a hacer sus vistas ajjaja, namas arregla lo que te pedi de usuasrios y susucrsales de indigo