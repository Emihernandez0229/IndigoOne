import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import { listOrders, createOrder, updateOrderStatus } from "../services/laboratorioService";


// branchId === "" significa "Todas las sucursales" (lo usa Ventas para
// buscar la orden ligada a una venta sin importar la sucursal) - sigue
// habilitado, solo cambia el filtro que manda listOrders.
export default function useLaboratorio(branchId) {
  const { data: orders, ...rest } = useCrudResource({
    list: () => listOrders(branchId),
    deps: [branchId],
    numbered: true,
    mutations: {
      create: { fn: createOrder, apply: prepend },
      changeStatus: { fn: updateOrderStatus, apply: mergeById },
    },
  });

  return { orders, ...rest };
}
