import { useAuth } from "../../shared/context/AuthContext";
import { ROLES } from "../../shared/security/roles";

import EmptyState from "../../shared/components/EmptyState";

import OwnerDashboardOpticas from "./views/OwnerDashboardOpticas";
import BranchManagerOpticas from "./views/BranchManagerOpticas";
import SalesDashboardOpticas from "./views/SalesDashboardOpticas";

const DASHBOARD_BY_ROLE = {
  [ROLES.OPTICA_DUENO]: OwnerDashboardOpticas,
  [ROLES.OPTICA_ENCARGADO]: BranchManagerOpticas,
  [ROLES.OPTICA_EMPLEADO]: SalesDashboardOpticas,
};


export default function OpticasDashboard() {

  const { user } = useAuth();

  const View = DASHBOARD_BY_ROLE[user?.role];


  if (!View) {
    return (
      <EmptyState
        title="Sin dashboard"
        description="Tu rol no tiene un panel asignado en Ópticas."
      />
    );
  }


  return <View />;

}
