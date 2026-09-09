import {useCallback, useEffect, useState} from "react";

import {listBranches, createBranch, updateBranch, deactivateBranch} from "../services/branchService";


export default function useBranches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);


  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data =
          await listBranches();
        if (active) {
          setBranches(data);
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
    () =>
      setReloadKey(
        (key) => key + 1
      ),
    []
  );


  const create = useCallback(
    async (payload) => {
      const created =
        await createBranch(
          payload
        );

      setBranches(
        (prev) => [
          ...prev,
          created
        ]
      );
      return created;
    },
    []
  );


  const update = useCallback(
    async (id, payload) => {
      const updated =
        await updateBranch(
          id,
          payload
        );

      setBranches(
        (prev) =>
          prev.map(
            (row) =>
              row.id === id
                ? {
                    ...row,
                    ...updated
                  }
                : row
          )
      );
      return updated;
    },
    []
  );


  const deactivate = useCallback(
    async (id) => {

      const updated =
        await deactivateBranch(id);


      setBranches(
        (prev) =>
          prev.map(
            (row) =>
              row.id === id
                ? {
                    ...row,
                    ...updated
                  }
                : row
          )
      );


      return updated;

    },
    []
  );


  return {
    branches,
    loading,
    error,
    reload,
    create,
    update,
    deactivate
  };

}