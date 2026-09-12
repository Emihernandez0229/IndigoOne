import { useCallback, useEffect, useState } from "react";
import {listUsers,createUser,updateUser,deactivateUser,activateUser} from "../services/userService";


export default function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState(null);

  const loadUsers = useCallback(async () => {

    try {
      setLoading(true);
      setError(null);
      const data =

        await listUsers();
      setUsers(data);

    } catch (err) {
      setError(err);

    } finally {
      setLoading(false);
    }

  }, []);


  useEffect(() => {
    loadUsers();
  }, [loadUsers]);


  const create = useCallback(async (payload) => {

    const created =
      await createUser(payload);

    setUsers((prev) => [
      created,
      ...prev,
    ]);

    return created;

  }, []);


  const update = useCallback(async (id, payload) => {

    const updated =
      await updateUser(id, payload);

    setUsers((prev) =>
      prev.map((user) =>
        String(user.id) === String(id)
          ? {
              ...user,
              ...updated,
            }
          : user
      )
    );

    return updated;

  }, []);


  const deactivate = useCallback(async (id) => {

    const updated =
      await deactivateUser(id);

    setUsers((prev) =>
      prev.map((user) =>
        String(user.id) === String(id)
          ? {
              ...user,
              ...updated,
            }
          : user
      )
    );

    return updated;

  }, []);


  const activate = useCallback(async (id) => {

    const updated =
      await activateUser(id);

    setUsers((prev) =>
      prev.map((user) =>
        String(user.id) === String(id)
          ? {
              ...user,
              ...updated,
            }
          : user
      )
    );

    return updated;

  }, []);


  return {
    users,
    loading,
    error,

    create,
    update,
    deactivate,
    activate,
    reload: loadUsers,
  };

}