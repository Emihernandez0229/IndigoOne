import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import {
  listInventory,
  createInventoryItem,
  updateInventoryItem,
  deactivateInventoryItem,
  activateInventoryItem,
} from "../services/inventoryService";


export default function useInventory() {
  const { data: items, ...rest } = useCrudResource({
    list: listInventory,
    mutations: {
      create: { fn: createInventoryItem, apply: prepend },
      update: { fn: updateInventoryItem, apply: mergeById },
      deactivate: { fn: deactivateInventoryItem, apply: mergeById },
      activate: { fn: activateInventoryItem, apply: mergeById },
    },
  });

  return { items, ...rest };
}
