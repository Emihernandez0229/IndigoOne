import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import { listVentas, createVenta, cancelVenta } from "../services/ventaService";


export default function useVentas(branchId) {
  const { data: ventas, ...rest } = useCrudResource({
    list: () => listVentas(branchId),
    enabled: Boolean(branchId),
    deps: [branchId],
    numbered: true,
    mutations: {
      create: { fn: createVenta, apply: prepend },
      cancel: { fn: cancelVenta, apply: mergeById },
    },
  });

  return { ventas, ...rest };
}
