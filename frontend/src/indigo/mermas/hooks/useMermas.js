import { useCrudResource } from "../../../shared/hooks/useCrudResource";
import { listMermas } from "../services/mermaService";


export default function useMermas() {
  const { data: mermas, ...rest } = useCrudResource({ list: listMermas });
  return { mermas, ...rest };
}
