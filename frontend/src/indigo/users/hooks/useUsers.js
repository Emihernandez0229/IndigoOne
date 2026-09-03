import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../../../shared/context/AuthContext";
import { scopeByBranch } from "../../../shared/security/dataScope";

import {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
} from "../services/userService";


/**
 * Estado y acciones de la pantalla de Usuarios.
 * Alcance por rol: el dueño ve todos, el jefe solo los de sus sucursales.
 */
export default function useUsers() {

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
        const data = await listUsers();
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


  const users = useMemo(
    () => scopeByBranch(rows, user, (row) => row.branchId),
    [rows, user]
  );


  const create = useCallback(async (payload) => {
    const created = await createUser(payload);
    setRows((prev) => [...prev, created]);
    return created;
  }, []);


  const update = useCallback(async (id, payload) => {
    const updated = await updateUser(id, payload);
    setRows((prev) => prev.map((row) => (row.id === id ? updated : row)));
    return updated;
  }, []);


  const deactivate = useCallback(async (id) => {
    const updated = await deactivateUser(id);
    setRows((prev) => prev.map((row) => (row.id === id ? updated : row)));
    return updated;
  }, []);


  return { users, loading, error, reload, create, update, deactivate };

}
