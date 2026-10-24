export function filterMermas(
  mermas = [],
  { query = "", branch = "", biselType = "", serviceType = "" } = {}
) {

  const q = query.trim().toLowerCase();

  return mermas.filter((merma) => {
    const matchesQuery =
      !q ||
      (merma.folio ?? "").toLowerCase().includes(q) ||
      (merma.clientName ?? "").toLowerCase().includes(q) ||
      (merma.seller ?? "").toLowerCase().includes(q);

    const matchesBranch = !branch || String(merma.branchId) === String(branch);
    const matchesBisel = !biselType || merma.biselType === biselType;
    const matchesService = !serviceType || merma.serviceType === serviceType;

    return matchesQuery && matchesBranch && matchesBisel && matchesService;
  });

}
