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
    pais: raw.pais ?? "México",

    regimenFiscal: raw.regimen_fiscal ?? raw.regimenFiscal ?? "",

    colorPrincipal: raw.color_principal ?? raw.colorPrincipal ?? "#1E3AAB",
    colorSecundario: raw.color_secundario ?? raw.colorSecundario ?? "#60DAFA",
    eslogan: raw.eslogan ?? "",
  };
}

// Forma vacía (mismos defaults que mapInfo) para cuando la óptica todavía
// no tiene fila en optica_configuracion - ver getOpticaInfo().
export function emptyOpticaInfo() {
  return mapInfo({});
}


function emptyToUndefined(value) {
  const trimmed = typeof value === "string" ? value.trim() : value;
  return trimmed === "" || trimmed == null ? undefined : trimmed;
}

// Inverso de mapInfo(): camelCase -> snake_case, y los campos vacíos se
// omiten (no se mandan como "") porque varios son opcionales-pero-no-vacíos
// en el back (ej. correo valida formato de email incluso siendo opcional).
function toConfiguracionPayload(payload) {
  return {
    nombre_comercial: emptyToUndefined(payload.nombreComercial),
    responsable_sanitario: emptyToUndefined(payload.responsableSanitario),
    razon_social: emptyToUndefined(payload.razonSocial),
    telefono: emptyToUndefined(payload.telefono),
    correo: emptyToUndefined(payload.correo),

    calle: emptyToUndefined(payload.calle),
    numero_exterior: emptyToUndefined(payload.numeroExterior),
    numero_interior: emptyToUndefined(payload.numeroInterior),
    colonia: emptyToUndefined(payload.colonia),
    codigo_postal: emptyToUndefined(payload.codigoPostal),
    municipio: emptyToUndefined(payload.municipio),
    estado_direccion: emptyToUndefined(payload.estadoDireccion),
    pais: emptyToUndefined(payload.pais),

    rfc: emptyToUndefined(payload.rfc),
    regimen_fiscal: emptyToUndefined(payload.regimenFiscal),
    correo_fiscal: emptyToUndefined(payload.correoFiscal),

    logo_url: emptyToUndefined(payload.logoUrl),
    color_principal: emptyToUndefined(payload.colorPrincipal),
    color_secundario: emptyToUndefined(payload.colorSecundario),
    eslogan: emptyToUndefined(payload.eslogan),
  };
}


/**
 * El Dueño ve la configuración completa; Encargado/Empleado solo pueden
 * pedir la versión operativa (nombre_comercial, logo_url, colores,
 * eslogan - ver configuracion.routes.js del back, GET / es solo dueño).
 */
export async function getOpticaInfo(isOwner) {
  const path = isOwner ? "/api/opticas/configuracion" : "/api/opticas/configuracion/operativa";
  const info = await httpClient.get(path);
  return mapInfo(info);
}


// Solo se usa la primera vez: si la óptica aún no tiene fila en
// optica_configuracion, getOpticaInfo() truena con 404 y hay que crear en
// vez de actualizar (ver OpticaPage.jsx).
export async function createOpticaInfo(payload) {
  const info = await httpClient.post("/api/opticas/configuracion", toConfiguracionPayload(payload));
  return mapInfo(info);
}


export async function updateOpticaInfo(payload) {
  const info = await httpClient.patch("/api/opticas/configuracion", toConfiguracionPayload(payload));
  return mapInfo(info);
}
