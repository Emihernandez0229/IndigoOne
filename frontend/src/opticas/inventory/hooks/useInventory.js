import { useEffect, useState } from "react";
import { listIndigoCatalog } from "../services/inventoryService";
import { buildCatalog } from "../catalogAggregate";

export default function useInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listIndigoCatalog();
        if (active) setItems(buildCatalog(Array.isArray(data) ? data : []));
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { items, loading, error };
}
