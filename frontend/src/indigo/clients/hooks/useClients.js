import { useCrudResource } from "../../../shared/hooks/useCrudResource";
import { listClients } from "../services/clientService";


export default function useClients() {
  const { data: clients, ...rest } = useCrudResource({ list: listClients });
  return { clients, ...rest };
}
