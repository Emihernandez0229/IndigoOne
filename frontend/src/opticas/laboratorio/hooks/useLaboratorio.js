import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import { listOrders, createOrder, updateOrderStatus } from "../services/laboratorioService";


export default function useLaboratorio(branchId) {
  const { data: orders, ...rest } = useCrudResource({
    list: () => listOrders(branchId),
    enabled: Boolean(branchId),
    deps: [branchId],
    numbered: true,
    mutations: {
      create: { fn: createOrder, apply: prepend },
      changeStatus: { fn: updateOrderStatus, apply: mergeById },
    },
  });

  return { orders, ...rest };
}
