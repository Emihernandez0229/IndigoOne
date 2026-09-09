// import { ROLES } from "./roles";

// import { indigoNavigation } from "../navigation/indigoNavigation";
// import { opticaNavigation } from "../navigation/opticaNavigation";

// export const ROLE_CONFIG = {

//   [ROLES.INDIGO_OWNER]: {
//     module: "indigo",
//     home: "/indigo/dashboard",
//     navigation: indigoNavigation,
//     label: "Dueño Indigo",
//   },

//   [ROLES.INDIGO_BRANCH_MANAGER]: {
//     module: "indigo",
//     home: "/indigo/dashboard",
//     navigation: indigoNavigation,
//     label: "Gerente de sucursal",
//   },

//   [ROLES.INDIGO_SALES]: {
//     module: "indigo",
//     home: "/indigo/dashboard",
//     navigation: indigoNavigation,
//     label: "Ventas Indigo",
//   },

//   [ROLES.INDIGO_LAB]: {
//     module: "indigo",
//     home: "/indigo/dashboard",
//     navigation: indigoNavigation,
//     label: "Laboratorio Indigo",
//   },

//   [ROLES.OPTICA_OWNER]: {
//     module: "opticas",
//     home: "/opticas/dashboard",
//     navigation: opticaNavigation,
//     label: "Dueño Óptica",
//   },

//   [ROLES.OPTICA_BRANCH_MANAGER]: {
//     module: "opticas",
//     home: "/opticas/dashboard",
//     navigation: opticaNavigation,
//     label: "Gerente Óptica",
//   },

//   [ROLES.OPTICA_EMPLOYEE]: {
//     module: "opticas",
//     home: "/opticas/dashboard",
//     navigation: opticaNavigation,
//     label: "Empleado Óptica",
//   },

// };


// export function getRoleConfig(role) {

//   return ROLE_CONFIG[role] ?? null;

// }


// export function getHomePathForRole(role) {

//   return ROLE_CONFIG[role]?.home ?? "/login";

// }


// export function getNavigationForRole(role) {

//   return ROLE_CONFIG[role]?.navigation ?? [];

// }


import { ROLES } from "./roles";

import { indigoNavigation } from "../navigation/indigoNavigation";
import { opticaNavigation } from "../navigation/opticaNavigation";

export const ROLE_CONFIG = {

  [ROLES.INDIGO_SUPER_USUARIO]: {
    module: "indigo",
    home: "/indigo/dashboard",
    navigation: indigoNavigation,
    label: "Super usuario",
  },

  [ROLES.INDIGO_DUENO]: {
    module: "indigo",
    home: "/indigo/dashboard",
    navigation: indigoNavigation,
    label: "Dueño Indigo",
  },

  [ROLES.INDIGO_GERENTE_SUCURSAL]: {
    module: "indigo",
    home: "/indigo/dashboard",
    navigation: indigoNavigation,
    label: "Gerente de sucursal",
  },

  [ROLES.INDIGO_EMPLEADO_VENTAS]: {
    module: "indigo",
    home: "/indigo/dashboard",
    navigation: indigoNavigation,
    label: "Ventas Indigo",
  },

  [ROLES.INDIGO_EMPLEADO_LABORATORIO]: {
    module: "indigo",
    home: "/indigo/dashboard",
    navigation: indigoNavigation,
    label: "Laboratorio Indigo",
  },

  [ROLES.OPTICA_DUENO]: {
    module: "opticas",
    home: "/opticas/dashboard",
    navigation: opticaNavigation,
    label: "Dueño Óptica",
  },

  [ROLES.OPTICA_ENCARGADO]: {
    module: "opticas",
    home: "/opticas/dashboard",
    navigation: opticaNavigation,
    label: "Gerente Óptica",
  },

  [ROLES.OPTICA_EMPLEADO]: {
    module: "opticas",
    home: "/opticas/dashboard",
    navigation: opticaNavigation,
    label: "Empleado Óptica",
  },

};


export function getRoleConfig(role) {

  return ROLE_CONFIG[role] ?? null;

}


export function getHomePathForRole(role) {

  return ROLE_CONFIG[role]?.home ?? "/login";

}


export function getNavigationForRole(role) {

  return ROLE_CONFIG[role]?.navigation ?? [];

}