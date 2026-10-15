import { useAuth } from "../../shared/context/AuthContext";
import { ROLES } from "../../shared/security/roles";

import UsersPage from "./UsersPage";
import ManagerEmployeesPage from "./manager/ManagerEmployeesPage";
import SuperUserPersonalPage from "./superuser/SuperUserPersonalPage";


const BRANCH_SCOPED_ROLES = [ROLES.INDIGO_GERENTE_SUCURSAL, ROLES.INDIGO_SUBGERENTE];


/**
 * El Dueño ve "Personal" de todas las sucursales, solo consulta (UsersPage).
 * El Gerente/Subgerente administra "Empleados" de SU sucursal (alta,
 * edicion, baja) con ManagerEmployeesPage. El Super usuario administra
 * TODO el personal (incluido Dueño) con SuperUserPersonalPage. Misma ruta
 * "/indigo/usuarios", distinta vista segun el rol - mismo patron que
 * ClientsRouter.jsx.
 */
export default function UsersRouter() {

  const { user: currentUser } = useAuth();

  if (currentUser?.role === ROLES.INDIGO_SUPER_USUARIO) {
    return <SuperUserPersonalPage />;
  }

  if (BRANCH_SCOPED_ROLES.includes(currentUser?.role)) {
    return <ManagerEmployeesPage />;
  }

  return <UsersPage />;

}
