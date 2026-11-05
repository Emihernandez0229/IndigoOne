import { useEffect, useState } from "react";

import { listCategoriasProductos, listCategoriasServicios } from "../services/catalogoService";


function useCategorias(list) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await list();
        if (active) setCategorias(data);
      } catch {
        if (active) setCategorias([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { categorias, loading };
}

export function useCategoriasProductos() {
  return useCategorias(listCategoriasProductos);
}

export function useCategoriasServicios() {
  return useCategorias(listCategoriasServicios);
}
