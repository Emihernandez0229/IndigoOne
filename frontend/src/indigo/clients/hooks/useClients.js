import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import { listClients, createClient, updateClient, deactivateClient, activateClient } from "../services/clientService";


export default function useClients() {
  const { data: clients, ...rest } = useCrudResource({
    list: listClients,
    mutations: {
      create: { fn: createClient, apply: prepend },
      update: { fn: updateClient, apply: mergeById },
      deactivate: { fn: deactivateClient, apply: mergeById },
      activate: { fn: activateClient, apply: mergeById },
    },
  });

  return { clients, ...rest };
}
