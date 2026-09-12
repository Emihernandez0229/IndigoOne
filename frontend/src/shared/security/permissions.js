
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

    "sales.view",

    "laboratory.view",
    "laboratory.job.view",

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
    "user.create",
    "user.update",
    "user.deactivate",

    "sales.view",

    "laboratory.view",
    "laboratory.job.view",

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

    "sales.view",

    "laboratory.view",
    "laboratory.job.view",

    "reports.branch",
  ],


  [ROLES.INDIGO_EMPLEADO_VENTAS]: [
    "customer.create",

    "sales.create",
    "sales.view",

    "laboratory.job.create",
  ],


  [ROLES.INDIGO_EMPLEADO_LABORATORIO]: [
    "laboratory.job.view",
    "laboratory.job.accept",
    "laboratory.job.update",
  ],


  // OPTICAS
  [ROLES.OPTICA_DUENO]: [
    "optica.user.view",
    "optica.user.create",

    "optica.sales.view",

    "optica.patient.view",

    "optica.reports.view",
  ],


  [ROLES.OPTICA_ENCARGADO]: [
    "optica.user.view",
    "optica.user.create",

    "optica.sales.view",

    "optica.patient.view",
    "optica.patient.create",

    "optica.appointment.manage",
  ],


  [ROLES.OPTICA_EMPLEADO]: [
    "optica.patient.view",
    "optica.patient.create",

    "optica.appointment.manage",

    "optica.sales.create",
  ],

};