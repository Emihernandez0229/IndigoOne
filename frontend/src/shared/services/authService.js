import { httpClient } from "../api/httpClient";
import { buildRoleKey } from "../security/roles";
import { getPermissionsForRole } from "../security/accessControl";
import { getRoleConfig } from "../security/roleConfig";
import {persistSession,readStoredSession,clearStoredSession,getToken,} from "./sessionStorage";

export { readStoredSession, clearStoredSession, getToken };

export async function loginRequest({ username, password, recordarme }) {
  const { token, usuario } = await httpClient.post("/api/auth/login", {
    usuario: username,
    password,
  });
  const role = buildRoleKey(usuario.tipo, usuario.rol);


  const session = {
    token,
    user: {
      id: usuario.id,
      name: usuario.nombre,
      username: usuario.usuario,
      role,
      tipo: usuario.tipo,
      opticaId: usuario.optica_id ?? null,
      sucursalId: usuario.sucursal_id ?? null,
      passwordPendienteCambio: usuario.password_pendiente_cambio ?? false,
      permissions: getPermissionsForRole(role),
    },
  };

  //solo para ver que usuario esta ingresando en la consola del navegador
  // console.log("USUARIO BACKEND:", usuario);
  // console.log("TIPO:", usuario.tipo);
  // console.log("ROL:", usuario.rol);
  // console.log("ROLE GENERADO:", role);
  // console.log("ROLE CONFIG:", getRoleConfig(role));

  

  persistSession(session, recordarme);
  return session;
}


export async function cambiarPasswordRequest(passwordNueva) {
  return httpClient.post("/api/auth/login/cambiar-password", { passwordNueva });
}