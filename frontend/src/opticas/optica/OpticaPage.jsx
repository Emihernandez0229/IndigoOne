import { useEffect, useState } from "react";

import PageContainer from "../../shared/layouts/PageContainer";
import TabBar from "../../shared/components/TabBar";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import usePermissions from "../../shared/hooks/usePermissions";

import { getOpticaInfo, updateOpticaInfo } from "./services/opticaService";
import PerfilTab from "./components/PerfilTab";
import InformacionGeneralTab from "./components/InformacionGeneralTab";
import DomicilioFiscalTab from "./components/DomicilioFiscalTab";
import ConfiguracionComercialTab from "./components/ConfiguracionComercialTab";
import IdentidadMarcaTab from "./components/IdentidadMarcaTab";


const TABS = [
  { value: "perfil", label: "Perfil" },
  { value: "general", label: "Información general" },
  { value: "fiscal", label: "Domicilio fiscal" },
  { value: "comercial", label: "Configuración comercial" },
  { value: "marca", label: "Identidad de marca" },
];


export default function OpticaPage() {

  const { can } = usePermissions();
  const canManage = can("optica.settings.manage");

  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("perfil");

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
  };


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  return (

    <PageContainer title="Óptica" description="Información de la empresa.">

      <div className="space-y-6">

        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {tab === "perfil" && <PerfilTab info={info} />}
        {tab === "general" && <InformacionGeneralTab info={info} canManage={canManage} onSave={handleSave} />}
        {tab === "fiscal" && <DomicilioFiscalTab info={info} canManage={canManage} onSave={handleSave} />}
        {tab === "comercial" && <ConfiguracionComercialTab info={info} canManage={canManage} onSave={handleSave} />}
        {tab === "marca" && <IdentidadMarcaTab info={info} canManage={canManage} onSave={handleSave} />}

      </div>

    </PageContainer>

  );

}
