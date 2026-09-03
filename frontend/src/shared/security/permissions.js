
export const PERMISSIONS = {

  // ---------- INDIGO ----------

  INDIGO_OWNER: [
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

  INDIGO_BRANCH_MANAGER: [
    "branch.view",
    "user.view",
    "user.create",
    "user.update",
    "user.deactivate",
    "sales.view",
    "laboratory.view",
    "laboratory.job.view",
    "reports.branch",
  ],

  INDIGO_SALES: [
    "customer.create",
    "sales.create",
    "sales.view",
    "laboratory.job.create",
  ],

  INDIGO_LAB: [
    "laboratory.job.view",
    "laboratory.job.accept",
    "laboratory.job.update",
  ],


  // ---------- OPTICAS ----------

  OPTICA_OWNER: [
    "optica.user.view",
    "optica.user.create",
    "optica.sales.view",
    "optica.patient.view",
    "optica.reports.view",
  ],

  OPTICA_BRANCH_MANAGER: [
    "optica.user.view",
    "optica.user.create",
    "optica.sales.view",
    "optica.patient.view",
    "optica.patient.create",
    "optica.appointment.manage",
  ],

  OPTICA_EMPLOYEE: [
    "optica.patient.view",
    "optica.patient.create",
    "optica.appointment.manage",
    "optica.sales.create",
  ],

};
