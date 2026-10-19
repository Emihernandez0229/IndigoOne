import { httpClient } from "../../../shared/api/httpClient";


function mapInfo(raw) {
  if (!raw) return null;
  return {
    logoUrl: raw.logo_url ?? raw.logoUrl ?? "",
    nombreComercial: raw.nombre_comercial ?? raw.nombreComercial ?? "",
    razonSocial: raw.razon_social ?? raw.razonSocial ?? "",
    rfc: raw.rfc ?? "",
    responsableSanitario: raw.responsable_sanitario ?? raw.responsableSanitario ?? "",
    telefono: raw.telefono ?? "",
    correo: raw.correo ?? "",
    correoFiscal: raw.correo_fiscal ?? raw.correoFiscal ?? "",

    calle: raw.calle ?? "",
    numeroExterior: raw.numero_exterior ?? raw.numeroExterior ?? "",
    numeroInterior: raw.numero_interior ?? raw.numeroInterior ?? "",
    colonia: raw.colonia ?? "",
    codigoPostal: raw.codigo_postal ?? raw.codigoPostal ?? "",
    municipio: raw.municipio ?? "",
    estadoDireccion: raw.estado_direccion ?? raw.estadoDireccion ?? "",
    pais: raw.pais ?? "",

    regimenFiscal: raw.regimen_fiscal ?? raw.regimenFiscal ?? "",

    colorPrincipal: raw.color_principal ?? raw.colorPrincipal ?? "#1E3AAB",
    colorSecundario: raw.color_secundario ?? raw.colorSecundario ?? "#60DAFA",
    eslogan: raw.eslogan ?? "",
  };
}


export async function getOpticaInfo() {
  const { info } = await httpClient.get("/api/opticas/informacion");
  return mapInfo(info);
}


export async function updateOpticaInfo(payload) {
  const { info } = await httpClient.put("/api/opticas/informacion", {
    logoUrl: payload.logoUrl,
    nombreComercial: payload.nombreComercial,
    razonSocial: payload.razonSocial,
    rfc: payload.rfc,
    responsableSanitario: payload.responsableSanitario,
    telefono: payload.telefono,
    correo: payload.correo,
    correoFiscal: payload.correoFiscal,

    calle: payload.calle,
    numeroExterior: payload.numeroExterior,
    numeroInterior: payload.numeroInterior,
    colonia: payload.colonia,
    codigoPostal: payload.codigoPostal,
    municipio: payload.municipio,
    estadoDireccion: payload.estadoDireccion,
    pais: payload.pais,

    regimenFiscal: payload.regimenFiscal,

    colorPrincipal: payload.colorPrincipal,
    colorSecundario: payload.colorSecundario,
    eslogan: payload.eslogan,
  });
  return mapInfo(info);
}
