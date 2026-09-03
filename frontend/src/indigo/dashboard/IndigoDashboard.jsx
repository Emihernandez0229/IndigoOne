import { useAuth } from "../../shared/context/AuthContext";
import { ROLES } from "../../shared/security/roles";

import EmptyState from "../../shared/components/EmptyState";

import OwnerDashboard from "./views/OwnerDashboard";
import BranchManagerDashboard from "./views/BranchManagerDashboard";
import SalesDashboard from "./views/SalesDashboard";
import LaboratoryDashboard from "./views/LaboratoryDashboard";

//Todas las rutas Indigo entran por aqui (/indigo/dashboard).
const DASHBOARD_BY_ROLE = {
  [ROLES.INDIGO_OWNER]: OwnerDashboard,
  [ROLES.INDIGO_BRANCH_MANAGER]: BranchManagerDashboard,
  [ROLES.INDIGO_SALES]: SalesDashboard,
  [ROLES.INDIGO_LAB]: LaboratoryDashboard,
};


export default function IndigoDashboard() {

  const { user } = useAuth();

  const View = DASHBOARD_BY_ROLE[user?.role];


  if (!View) {
    return (
      <EmptyState
        title="Sin dashboard"
        description="Tu rol no tiene un panel asignado en Indigo."
      />
    );
  }


  return <View />;

}
