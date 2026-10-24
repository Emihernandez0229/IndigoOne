import { useCallback, useEffect, useState } from "react";


// Helpers de "apply" listos para usar en la config de mutations.
export const prepend = (prev, created) => [created, ...prev];

export const append = (prev, created) => [...prev, created];

export const mergeById = (prev, updated, args) => {
  const id = args[0];
  return prev.map((row) => (String(row.id) === String(id) ? { ...row, ...updated } : row));
};

function withDisplayIds(list) {
  return list.map((row, index) => ({ ...row, displayId: index + 1 }));
}


/**
 * Hook generico para el patron repetido en todos los modulos:
 * cargar una lista, poder recargarla, y aplicar mutaciones (crear,
 * actualizar, dar de baja, cambiar estado...) que actualizan esa
 * lista en memoria sin volver a pedirla al backend.
 *
 * `list`      - funcion async que regresa el arreglo.
 * `enabled`   - si es false, no se pide nada y data queda en [] (util
 *               para paginas que dependen de una sucursal seleccionada).
 * `deps`      - dependencias que disparan un refetch (ej. [branchId]).
 * `numbered`  - si es true, agrega/recalcula `displayId` (1,2,3...) cada
 *               vez que la lista cambia, igual que hacian los hooks viejos.
 * `mutations` - mapa { nombre: { fn, apply } }. `fn` es la llamada al
 *               servicio; `apply(prevData, resultado, argsDeLaLlamada)`
 *               regresa la nueva lista. Se exponen como funciones con
 *               ese mismo nombre en el resultado del hook.
 *
 * Ejemplo (reemplaza lo que antes era useVentas completo):
 *   const { data: ventas, ...rest } = useCrudResource({
 *     list: () => listVentas(branchId),
 *     enabled: Boolean(branchId),
 *     deps: [branchId],
 *     numbered: true,
 *     mutations: {
 *       create: { fn: createVenta, apply: prepend },
 *       cancel: { fn: cancelVenta, apply: mergeById },
 *     },
 *   });
 */
export function useCrudResource({
  list,
  enabled = true,
  deps = [],
  numbered = false,
  mutations = {},
}) {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const renumber = useCallback(
    (rows) => (numbered ? withDisplayIds(rows) : rows),
    [numbered]
  );

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await list();
        if (active) {
          setData(renumber(result));
        }
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reloadKey, ...deps]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const actionEntries = Object.entries(mutations).map(([name, { fn, apply }]) => [
    name,
    async (...args) => {
      const result = await fn(...args);
      setData((prev) => renumber(apply(prev, result, args)));
      return result;
    },
  ]);
  const actions = Object.fromEntries(actionEntries);

  return { data, loading, error, reload, ...actions };
}
