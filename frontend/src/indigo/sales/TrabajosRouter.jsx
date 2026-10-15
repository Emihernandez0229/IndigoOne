import { useAuth } from "../../shared/context/AuthContext";
import { ROLES } from "../../shared/security/roles";

import JobsPage from "./JobsPage";
import LabJobsPage from "../lab/LabJobsPage";


/**
 * El Empleado de Ventas registra y consulta SUS trabajos (JobsPage).
 * El Empleado de Laboratorio da seguimiento a TODOS los trabajos de su
 * sucursal, con acciones de aceptar/terminar/merma (LabJobsPage).
 * Misma ruta "/indigo/trabajos", distinta vista segun el rol - mismo
 * patron que ClientsRouter.jsx / UsersRouter.jsx.
 */
export default function TrabajosRouter() {

  const { user: currentUser } = useAuth();

  if (currentUser?.role === ROLES.INDIGO_EMPLEADO_LABORATORIO) {
    return <LabJobsPage />;
  }

  return <JobsPage />;

}
