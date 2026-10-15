import { useAuth } from "../../shared/context/AuthContext";
import { ROLES } from "../../shared/security/roles";

import ClientsPage from "./ClientsPage";
import ManagerClientsPage from "./manager/ManagerClientsPage";


const BRANCH_SCOPED_ROLES = [
  ROLES.INDIGO_GERENTE_SUCURSAL,
  ROLES.INDIGO_SUBGERENTE,
  ROLES.INDIGO_EMPLEADO_VENTAS,
];


/**
 * El Dueño ve todos los clientes de Indigo, solo consulta (ClientsPage).
 * Gerente/Subgerente/Empleado de ventas comparten ManagerClientsPage,
 * limitado a los clientes de SU sucursal; esa pagina ya ajusta los
 * botones de editar/dar de baja/"Nuevo cliente" segun los permisos de
 * cada rol (el Empleado de Ventas solo tiene client.view -> solo lectura).
 * Misma ruta "/indigo/clientes", distinta vista segun el rol - mismo
 * patron que IndigoDashboard.jsx.
 */
export default function ClientsRouter() {

  const { user: currentUser } = useAuth();

  if (BRANCH_SCOPED_ROLES.includes(currentUser?.role)) {
    return <ManagerClientsPage />;
  }

  return <ClientsPage />;

}
