import { useCrudResource, prepend } from "../../../shared/hooks/useCrudResource";
import { listVentas, createVenta } from "../services/ventaService";


export default function useVentas(branchId) {
  const { data: ventas, ...rest } = useCrudResource({
    list: () => listVentas(branchId),
    enabled: Boolean(branchId),
    deps: [branchId],
    numbered: true,
    mutations: {
      create: { fn: createVenta, apply: prepend },
    },
  });

  return { ventas, ...rest };
}
