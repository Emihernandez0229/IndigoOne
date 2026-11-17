export function filterPatients(patients = [], { query = "", branch = "", status = "" } = {}) {
  const term = query.trim().toLowerCase();

  return patients.filter((patient) => {
    const matchesQuery =
      !term ||
      (patient.name ?? "").toLowerCase().includes(term) ||
      (patient.phone ?? "").toLowerCase().includes(term) ||
      (patient.email ?? "").toLowerCase().includes(term);

    const matchesBranch = !branch || String(patient.branchId) === String(branch);

    const matchesStatus = !status || (status === "active" ? patient.active : !patient.active);

    return matchesQuery && matchesBranch && matchesStatus;
  });
}
