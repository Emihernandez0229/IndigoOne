export function filterClients(clients = [], { query = "", branch = "", status = "" } = {}) {

  const q = query.trim().toLowerCase();

  return clients.filter((client) => {
    const matchesQuery =
      !q ||
      (client.name ?? "").toLowerCase().includes(q) ||
      (client.code ?? "").toLowerCase().includes(q) ||
      (client.businessName ?? "").toLowerCase().includes(q);

    const matchesBranch = !branch || String(client.branchId) === String(branch);
    const matchesStatus = !status || client.status === status;

    return matchesQuery && matchesBranch && matchesStatus;
  });

}
