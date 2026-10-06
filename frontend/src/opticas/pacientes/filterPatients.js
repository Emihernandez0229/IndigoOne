export function filterPatients(patients = [], { query = "" } = {}) {
  const term = query.trim().toLowerCase();

  if (!term) {
    return patients;
  }

  return patients.filter((patient) => {
    const name = (patient.name ?? "").toLowerCase();
    const phone = (patient.phone ?? "").toLowerCase();
    return name.includes(term) || phone.includes(term);
  });
}
