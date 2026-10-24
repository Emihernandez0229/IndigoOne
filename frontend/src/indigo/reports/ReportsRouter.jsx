import { useAuth } from "../../shared/context/AuthContext";
import { ROLES } from "../../shared/security/roles";

import ReportsPage from "./ReportsPage";
import ManagerReportsPage from "./ManagerReportsPage";


const BRANCH_SCOPED_ROLES = [ROLES.INDIGO_GERENTE_SUCURSAL, ROLES.INDIGO_SUBGERENTE];


/**
 * El Dueño/Super usuario ve el comparativo global entre sucursales
 * (ReportsPage). El Gerente de sucursal y Subgerente ven un reporte propio,
 * enfocado solo en su sucursal (ManagerReportsPage). Mismo patron que
 * ClientsRouter.jsx / UsersRouter.jsx / TrabajosRouter.jsx.
 */
export default function ReportsRouter() {

  const { user: currentUser } = useAuth();

  if (BRANCH_SCOPED_ROLES.includes(currentUser?.role)) {
    return <ManagerReportsPage />;
  }

  return <ReportsPage />;

}
