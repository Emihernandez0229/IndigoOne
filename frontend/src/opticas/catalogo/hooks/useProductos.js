import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import {
  listProductos,
  createProducto,
  updateProducto,
  deactivateProducto,
  activateProducto,
  deactivateProductoBranch,
  activateProductoBranch,
  registerProductoMovimiento,
} from "../services/catalogoService";


export default function useProductos() {
  const { data: productos, ...rest } = useCrudResource({
    list: listProductos,
    mutations: {
      create: { fn: createProducto, apply: prepend },
      update: { fn: updateProducto, apply: mergeById },
      deactivate: { fn: deactivateProducto, apply: mergeById },
      activate: { fn: activateProducto, apply: mergeById },
      // Jefe de sucursal: alta/baja y movimientos de stock solo de su
      // sucursal (ver CatalogoPage).
      deactivateBranch: { fn: deactivateProductoBranch, apply: mergeById },
      activateBranch: { fn: activateProductoBranch, apply: mergeById },
      registerMovimiento: { fn: registerProductoMovimiento, apply: mergeById },
    },
  });

  return { productos, ...rest };
}
