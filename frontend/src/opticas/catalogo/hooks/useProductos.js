import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import {
  listProductos,
  createProducto,
  updateProducto,
  deactivateProducto,
  activateProducto,
} from "../services/catalogoService";


export default function useProductos() {
  const { data: productos, ...rest } = useCrudResource({
    list: listProductos,
    mutations: {
      create: { fn: createProducto, apply: prepend },
      update: { fn: updateProducto, apply: mergeById },
      deactivate: { fn: deactivateProducto, apply: mergeById },
      activate: { fn: activateProducto, apply: mergeById },
    },
  });

  return { productos, ...rest };
}
