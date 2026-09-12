import { useEffect, useState } from "react";

import { useAuth } from "../../../shared/context/AuthContext";
import { getIndigoDashboardData } from "../services/dashboardService";
import { mapKpisToCards } from "../mapKpis";


/**
 * Carga los datos del dashboard de Indigo para el rol del usuario actual.
 * Cuando exista backend, solo cambia getIndigoDashboardData().
 */
export default function useIndigoDashboard() {

  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {

    let active = true;

    async function load() {

      try {

        setLoading(true);

        const response = await getIndigoDashboardData(user?.role);

        if (active) {
          setData({
            ...response,
            kpis: mapKpisToCards(user?.role, response?.kpis),
          });
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

    }

    load();

    return () => {
      active = false;
    };

  }, [user?.role]);


  return { data, loading, error };

}
