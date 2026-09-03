import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../../../shared/context/AuthContext";
import { scopeByBranch } from "../../../shared/security/dataScope";

import {
  listBranches,
  createBranch,
  updateBranch,
  deactivateBranch,
} from "../services/branchService";


/**
 * Estado y acciones de la pantalla de Sucursales.
 * Aplica el alcance por rol: el dueño ve todas, el jefe solo las suyas.
 */
export default function useBranches() {

  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);


  useEffect(() => {

    let active = true;

    (async () => {
      try {
        setLoading(true);
        const data = await listBranches();
        if (active) setRows(data);
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };

  }, [reloadKey]);


  const reload = useCallback(() => setReloadKey((key) => key + 1), []);


  // Solo las sucursales que este usuario puede ver.
  const branches = useMemo(
    () => scopeByBranch(rows, user, (row) => row.id),
    [rows, user]
  );


  const create = useCallback(async (payload) => {
    const created = await createBranch(payload);
    setRows((prev) => [...prev, created]);
    return created;
  }, []);


  const update = useCallback(async (id, payload) => {
    const updated = await updateBranch(id, payload);
    setRows((prev) => prev.map((row) => (row.id === id ? updated : row)));
    return updated;
  }, []);


  const deactivate = useCallback(async (id) => {
    const updated = await deactivateBranch(id);
    setRows((prev) => prev.map((row) => (row.id === id ? updated : row)));
    return updated;
  }, []);


  return { branches, loading, error, reload, create, update, deactivate };

}
