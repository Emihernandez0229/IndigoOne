import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";


/**
 * Patron repetido en todas las paginas que dependen de una sucursal:
 * el dueno puede elegir cualquiera de su negocio, gerente/empleado
 * siempre quedan fijos en la suya. Reemplaza el bloque de isOwner +
 * listBranches() + estado selectedBranch que se repetia en Pacientes,
 * Citas, Ventas, Laboratorio y Reportes.
 *
 *   const { isOwner, branches, selectedBranch, setSelectedBranch, loadingBranches } =
 *     useBranchScope({ listBranches, ownerRoles: [ROLES.OPTICA_DUENO] });
 *
 * `alwaysLoad: true` carga la lista de sucursales aunque el usuario no sea
 * dueno (util cuando una pagina necesita el nombre de la sucursal fija de
 * un gerente/empleado, no solo su id).
 *
 * `autoSelectFirst: false` evita que, al cargar la lista, se elija la
 * primera sucursal automaticamente - la pagina se queda en "" (Todas)
 * hasta que el dueno elija una. Usalo en paginas donde "Todas las
 * sucursales" es una opcion valida por defecto (ej. Ventas, Catalogo),
 * no en paginas que exigen una sucursal concreta (ej. Nueva venta).
 */
export default function useBranchScope({ listBranches, ownerRoles = [], alwaysLoad = false, autoSelectFirst = true }) {

  const { user: currentUser } = useAuth();
  const isOwner = ownerRoles.includes(currentUser?.role);
  const shouldLoad = isOwner || alwaysLoad;

  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(shouldLoad);
  const [selectedBranch, setSelectedBranch] = useState(
    isOwner ? "" : currentUser?.sucursalId ?? ""
  );

  useEffect(() => {
    if (!shouldLoad) {
      return;
    }

    let active = true;
    (async () => {
      try {
        setLoadingBranches(true);
        const data = await listBranches();
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setBranches(list);
        if (autoSelectFirst) {
          setSelectedBranch((prev) => prev || list[0]?.id || "");
        }
      } catch (error) {
        console.error("Error al cargar sucursales:", error);
        if (active) setBranches([]);
      } finally {
        if (active) setLoadingBranches(false);
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldLoad]);

  return { isOwner, branches, selectedBranch, setSelectedBranch, loadingBranches };
}
