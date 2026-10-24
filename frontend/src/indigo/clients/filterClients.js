export function filterClients(clients = [], { query = "", branch = "", status = "" } = {}) {

  const q = query.trim().toLowerCase();

  return clients.filter((client) => {
    const matchesQuery =
      !q ||
      (client.name ?? "").toLowerCase().includes(q) ||
      (client.code ?? "").toLowerCase().includes(q) ||
      (client.businessName ?? "").toLowerCase().includes(q) ||
      (client.rfc ?? "").toLowerCase().includes(q) ||
      (client.phone ?? "").toLowerCase().includes(q) ||
      (client.email ?? "").toLowerCase().includes(q);

    const matchesBranch =
      !branch ||
      (client.branches ?? []).some((b) => String(b.indigoBranchId) === String(branch));

    const matchesStatus = !status || client.status === status;

    return matchesQuery && matchesBranch && matchesStatus;
  });

}
