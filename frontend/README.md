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