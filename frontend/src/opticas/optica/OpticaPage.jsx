import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import TabBar from "../../shared/components/TabBar";
import Button from "../../shared/components/Button";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import usePermissions from "../../shared/hooks/usePermissions";
import { useAuth } from "../../shared/context/AuthContext";
import { ROLES } from "../../shared/security/roles";
import { useOpticaBrandTheme } from "../../shared/context/OpticaBrandThemeContext";

import { getOpticaInfo, updateOpticaInfo } from "./services/opticaService";
import OpticaBanner from "./components/OpticaBanner";
import InformacionGeneralTab from "./components/InformacionGeneralTab";
import InformacionFiscalTab from "./components/InformacionFiscalTab";
import IdentidadVisualTab from "./components/IdentidadVisualTab";


const ALL_TABS = [
  { value: "general", label: "Información general" },
  { value: "fiscal", label: "Información fiscal" },
  { value: "visual", label: "Identidad visual" },
];


/**
 * "Mi óptica" - el Dueño puede consultar y actualizar, el Jefe de sucursal
 * solo consultar (cada pestaña ya respeta `canManage`) y no ve "Información
 * fiscal" (no le corresponde), y el Empleado no tiene este módulo en
 * absoluto (sin el permiso "optica.settings.view" no aparece ni en el menú).
 */
export default function OpticaPage() {

  const { can } = usePermissions();
  const canManage = can("optica.settings.manage");
  const { user: currentUser } = useAuth();
  const { applyColors } = useOpticaBrandTheme();

  const TABS = currentUser?.role === ROLES.OPTICA_ENCARGADO
    ? ALL_TABS.filter((tab) => tab.value !== "fiscal")
    : ALL_TABS;

  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("general");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getOpticaInfo();
        if (active) setInfo(data);
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (payload) => {
    const updated = await updateOpticaInfo(payload);
    setInfo(updated);
    applyColors({ colorPrincipal: updated.colorPrincipal, colorSecundario: updated.colorSecundario });
    setEditMode(false);
  };

  const handleCancelEdit = () => setEditMode(false);


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  return (

    <PageContainer
      title="Mi óptica"
      description="Administra la información general de tu empresa."
      actions={
        canManage && !editMode && (
          <Button
            className="inline-flex items-center gap-2 py-2.5 text-sm"
            onClick={() => setEditMode(true)}
          >
            <Pencil className="h-4 w-4" />
            Editar información
          </Button>
        )
      }
    >

      <div className="space-y-6">

        <OpticaBanner info={info} />

        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {tab === "general" && <InformacionGeneralTab info={info} canManage={canManage && editMode} onSave={handleSave} onCancel={handleCancelEdit} />}
        {tab === "fiscal" && <InformacionFiscalTab info={info} canManage={canManage && editMode} onSave={handleSave} onCancel={handleCancelEdit} />}
        {tab === "visual" && <IdentidadVisualTab info={info} canManage={canManage} onSave={handleSave} />}

      </div>

    </PageContainer>

  );

}
