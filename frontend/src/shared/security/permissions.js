
// export const PERMISSIONS = {

//   // ---------- INDIGO ----------

//   INDIGO_OWNER: [
//     "branch.view",
//     "branch.create",
//     "branch.update",
//     "branch.deactivate",
//     "user.view",
//     "user.create",
//     "user.update",
//     "user.deactivate",
//     "sales.view",
//     "laboratory.view",
//     "laboratory.job.view",
//     "reports.global",
//     "reports.branch",
//     "reports.period",
//   ],

//   INDIGO_BRANCH_MANAGER: [
//     "branch.view",
//     "user.view",
//     "user.create",
//     "user.update",
//     "user.deactivate",
//     "sales.view",
//     "laboratory.view",
//     "laboratory.job.view",
//     "reports.branch",
//   ],

//   INDIGO_SALES: [
//     "customer.create",
//     "sales.create",
//     "sales.view",
//     "laboratory.job.create",
//   ],

//   INDIGO_LAB: [
//     "laboratory.job.view",
//     "laboratory.job.accept",
//     "laboratory.job.update",
//   ],


//   // ---------- OPTICAS ----------

//   OPTICA_OWNER: [
//     "optica.user.view",
//     "optica.user.create",
//     "optica.sales.view",
//     "optica.patient.view",
//     "optica.reports.view",
//   ],

//   OPTICA_BRANCH_MANAGER: [
//     "optica.user.view",
//     "optica.user.create",
//     "optica.sales.view",
//     "optica.patient.view",
//     "optica.patient.create",
//     "optica.appointment.manage",
//   ],

//   OPTICA_EMPLOYEE: [
//     "optica.patient.view",
//     "optica.patient.create",
//     "optica.appointment.manage",
//     "optica.sales.create",
//   ],

// };



import { ROLES } from "./roles";


export const PERMISSIONS = {

  // INDIGO
  [ROLES.INDIGO_SUPER_USUARIO]: [
    "branch.view",
    "branch.create",
    "branch.update",
    "branch.deactivate",

    "user.view",
    "user.create",
    "user.update",
    "user.deactivate",

    "client.view",

    "sales.view",

    "laboratory.view",
    "laboratory.job.view",

    "inventory.view",
    "inventory.manage",

    "reports.global",
    "reports.branch",
    "reports.period",
  ],


  [ROLES.INDIGO_DUENO]: [
    "branch.view",
    "branch.create",
    "branch.update",
    "branch.deactivate",

    "user.view",
    "user.deactivate",

    "client.view",

    "sales.view",

    "laboratory.view",
    "laboratory.job.view",

    "inventory.view",
    "inventory.manage",

    "reports.global",
    "reports.branch",
    "reports.period",
  ],


  [ROLES.INDIGO_GERENTE_SUCURSAL]: [
    "branch.view",
    "branch.update",

    "user.view",
    "user.create",
    "user.update",
    "user.deactivate",

    "client.view",
    "client.create",
    "client.update",
    "client.deactivate",

    "sales.view",

    "laboratory.view",
    "laboratory.job.view",

    "inventory.view",
    "inventory.manage",

    "reports.branch",
  ],


  // Mismos permisos que Gerente de Sucursal.
  [ROLES.INDIGO_SUBGERENTE]: [
    "branch.view",
    "branch.update",

    "user.view",
    "user.create",
    "user.update",
    "user.deactivate",

    "client.view",
    "client.create",
    "client.update",
    "client.deactivate",

    "sales.view",

    "laboratory.view",
    "laboratory.job.view",

    "inventory.view",
    "inventory.manage",

    "reports.branch",
  ],


  [ROLES.INDIGO_EMPLEADO_VENTAS]: [
    "customer.create",

    "client.view",

    "sales.create",
    "sales.view",

    "laboratory.job.view",
    "laboratory.job.create",

    "inventory.view",
  ],


  [ROLES.INDIGO_EMPLEADO_LABORATORIO]: [
    "laboratory.job.view",
    "laboratory.job.accept",
    "laboratory.job.update",
  ],


  // OPTICAS
  [ROLES.OPTICA_DUENO]: [
    "optica.settings.view",
    "optica.settings.manage",

    "optica.catalog.view",
    "optica.catalog.create",
    "optica.catalog.update",
    "optica.catalog.deactivate",

    "optica.branch.view",
    "optica.branch.create",
    "optica.branch.update",
    "optica.branch.deactivate",

    "optica.user.view",
    "optica.user.create",
    "optica.user.update",
    "optica.user.deactivate",

    "optica.sales.view",
    "optica.sales.create",
    "optica.sales.manage",

    "optica.patient.view",
    "optica.patient.create",
    "optica.patient.update",
    "optica.patient.deactivate",

    "optica.appointment.manage",

    "optica.lab.view",
    "optica.lab.create",
    "optica.lab.manage",

    "optica.inventory.view",
    "optica.inventory.manage",

    "optica.reports.view",
  ],


  [ROLES.OPTICA_ENCARGADO]: [
    "optica.settings.view",

    "optica.catalog.view",
    "optica.catalog.create",
    "optica.catalog.update",
    "optica.catalog.deactivate",

    "optica.branch.view",
    "optica.branch.update",

    "optica.user.view",
    "optica.user.create",
    "optica.user.update",
    "optica.user.deactivate",

    "optica.sales.view",
    "optica.sales.create",
    "optica.sales.manage",

    "optica.patient.view",
    "optica.patient.create",
    "optica.patient.update",
    "optica.patient.deactivate",

    "optica.appointment.manage",

    "optica.lab.view",
    "optica.lab.create",
    "optica.lab.manage",

    "optica.inventory.view",
    "optica.inventory.manage",

    "optica.reports.view",
  ],


  [ROLES.OPTICA_EMPLEADO]: [
    "optica.catalog.view",

    "optica.patient.view",
    "optica.patient.create",
    "optica.patient.update",
    "optica.patient.deactivate",

    "optica.appointment.manage",

    "optica.sales.view",
    "optica.sales.create",

    "optica.lab.view",
    "optica.lab.create",

    "optica.inventory.view",

    "optica.reports.view",
  ],

};