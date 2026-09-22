import { useCallback, useEffect, useState } from "react";

import {
  listInventory,
  createInventoryItem,
  updateInventoryItem,
  deactivateInventoryItem,
  activateInventoryItem,
} from "../services/inventoryService";


export default function useInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);


  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listInventory();
        if (active) {
          setItems(data);
        }
      } catch (err) {
        if (active) {
          setError(err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [reloadKey]);


  const reload = useCallback(
    () => setReloadKey((key) => key + 1),
    []
  );


  const create = useCallback(async (payload) => {
    const created = await createInventoryItem(payload);
    setItems((prev) => [created, ...prev]);
    return created;
  }, []);


  const update = useCallback(async (id, payload) => {
    const updated = await updateInventoryItem(id, payload);
    setItems((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, ...updated } : row
      )
    );
    return updated;
  }, []);


  const deactivate = useCallback(async (id) => {
    const updated = await deactivateInventoryItem(id);
    setItems((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, ...updated } : row
      )
    );
    return updated;
  }, []);


  const activate = useCallback(async (id) => {
    const updated = await activateInventoryItem(id);
    setItems((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, ...updated } : row
      )
    );
    return updated;
  }, []);


  return {
    items,
    loading,
    error,
    reload,
    create,
    update,
    deactivate,
    activate,
  };

}
