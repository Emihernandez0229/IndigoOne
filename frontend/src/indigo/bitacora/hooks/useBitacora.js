import { useCrudResource } from "../../../shared/hooks/useCrudResource";
import { listBitacora } from "../services/bitacoraService";


// Bitacora es de solo lectura (nunca se edita ni se borra), asi que no
// necesita mutations - solo lista y recarga.
export default function useBitacora() {
  const { data: entries, ...rest } = useCrudResource({ list: listBitacora });
  return { entries, ...rest };
}
