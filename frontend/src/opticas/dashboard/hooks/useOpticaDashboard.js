import { useEffect, useState } from "react";

import { useAuth } from "../../../shared/context/AuthContext";
import { getOpticasDashboardData } from "../services/dashboardService";
import { mapKpisToCards } from "../mapKpisOpticas";


/**
 * Carga los datos del dashboard de Ópticas para el rol del usuario actual.
 */
export default function useOpticasDashboard() {

  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {

    let active = true;

    async function load() {

      try {

        setLoading(true);

        const response = await getOpticasDashboardData(user?.role);

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
