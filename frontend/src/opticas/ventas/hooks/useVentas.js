import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import { listVentas, createVenta, liquidarVenta, changeVentaStatus, cancelVenta } from "../services/ventaService";


// branchId === "" significa "Todas las sucursales" - sigue habilitado,
// solo cambia el filtro que manda listVentas.
export default function useVentas(branchId) {
  const { data: ventas, ...rest } = useCrudResource({
    list: () => listVentas(branchId),
    deps: [branchId],
    numbered: true,
    mutations: {
      create: { fn: createVenta, apply: prepend },
      liquidar: { fn: liquidarVenta, apply: mergeById },
      changeStatus: { fn: changeVentaStatus, apply: mergeById },
      cancel: { fn: cancelVenta, apply: mergeById },
    },
  });

  return { ventas, ...rest };
}
