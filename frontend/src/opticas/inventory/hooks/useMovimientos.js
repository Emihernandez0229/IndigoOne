import { useEffect, useState } from "react";
import { listMovimientosProducto } from "../services/inventoryService";

/**
 * El back no tiene un listado plano de "todos los movimientos de todos
 * los productos" - solo expone el historial de UN producto en UNA
 * sucursal (GET /stock/:productoId/movimientos). Por eso este hook pide
 * un productId explícito en vez de traer todo de entrada.
 */
export default function useMovimientos(productId, branchId) {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!productId) {
        if (active) {
          setMovimientos([]);
          setLoading(false);
        }
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await listMovimientosProducto(productId, branchId);
        if (active) setMovimientos(data);
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [productId, branchId]);

  return { movimientos, loading, error };
}
