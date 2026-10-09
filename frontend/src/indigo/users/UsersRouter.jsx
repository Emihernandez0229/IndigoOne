import { useAuth } from "../../shared/context/AuthContext";
import { ROLES } from "../../shared/security/roles";

import UsersPage from "./UsersPage";
import ManagerEmployeesPage from "./manager/ManagerEmployeesPage";


const BRANCH_SCOPED_ROLES = [ROLES.INDIGO_GERENTE_SUCURSAL, ROLES.INDIGO_SUBGERENTE];


/**
 * El Dueño ve "Personal" de todas las sucursales, solo consulta (UsersPage).
 * El Gerente/Subgerente administra "Empleados" de SU sucursal (alta,
 * edicion, baja) con ManagerEmployeesPage. Misma ruta "/indigo/usuarios",
 * distinta vista segun el rol - mismo patron que ClientsRouter.jsx.
 */
export default function UsersRouter() {

  const { user: currentUser } = useAuth();

  if (BRANCH_SCOPED_ROLES.includes(currentUser?.role)) {
    return <ManagerEmployeesPage />;
  }

  return <UsersPage />;

}
