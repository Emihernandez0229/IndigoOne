import { httpClient } from "../../../shared/api/httpClient";
export async function listUsers() {
  return httpClient.get(
    "/api/indigo/usuarios"
  );
}

export async function getUserFormOptions(
  userId = null
) {
  const query =
    userId
      ? `?usuario_id=${userId}`
      : "";

  return httpClient.get(
    `/api/indigo/usuarios/opciones-formulario${query}`
  );
}


export async function createUser(
  payload
) {
  switch (payload.role) {

    case "INDIGO_SUPER_USUARIO":
      return httpClient.post("/api/indigo/usuarios/super-usuarios",
        {
          nombre:
            payload.name,
        }
      );

    case "INDIGO_OWNER":
      return httpClient.post("/api/indigo/usuarios/duenos",
        {
          nombre:
            payload.name,
        }
      );

    case "INDIGO_BRANCH_MANAGER":
      return httpClient.post("/api/indigo/usuarios/gerentes",
        {
          nombre:
            payload.name,
          sucursal_id:
            payload.newBranch
              ? null
              : payload.branchId || null,
          nueva_sucursal_nombre:
            payload.newBranch
              ? payload.newBranchName
              : null,
        }
      );

    case "INDIGO_SUBGERENTE":
      return httpClient.post("/api/indigo/usuarios/subgerentes",
        {
          nombre:
            payload.name,
          sucursal_id:
            payload.branchId || null,
        }
      );

    case "INDIGO_SALES":
      return httpClient.post("/api/indigo/usuarios/empleados",
        {
          nombre:
            payload.name,
          tipo:
            "ventas",
          sucursal_id:
            payload.branchId || null,
        }
      );


    case "INDIGO_LAB":

      return httpClient.post("/api/indigo/usuarios/empleados",
        {
          nombre:
            payload.name,
          tipo:
            "laboratorio",
          sucursal_id:
            payload.branchId || null,
        }
      );


    default:

      throw new Error(
        "Rol de usuario no válido."
      );

  }

}

export async function updateUser(
  id,
  payload
) {

  return httpClient.put(`/api/indigo/usuarios/${id}`,
    {
      rol:
        payload.role,

      sucursal_id:
        payload.newBranch
          ? null
          : payload.branchId || null,

      nueva_sucursal_nombre:
        payload.newBranch
          ? payload.newBranchName
          : null,
    }
  );

}

// Flujo del Gerente/Subgerente (modulo "Empleados" de su propia sucursal).
export async function createEmployee(payload) {
  const endpoint = payload.role === "indigo:subgerente" ? "subgerentes" : "empleados";

  return httpClient.post(`/api/indigo/usuarios/${endpoint}`, {
    nombre: payload.name,
    telefono: payload.phone,
    correo: payload.email,
    usuario: payload.username,
    tipo: payload.role === "indigo:empleado_laboratorio" ? "laboratorio" : "ventas",
    sucursal_id: payload.branchId,
  });
}


export async function updateEmployee(id, payload) {
  return httpClient.put(`/api/indigo/usuarios/${id}`, {
    nombre: payload.name,
    telefono: payload.phone,
    correo: payload.email,
    puesto: payload.role,
  });
}


// "Mi perfil" (todos los roles): cada quien edita su propia informacion.
export async function updateMyProfile(id, payload) {
  return httpClient.put(`/api/indigo/usuarios/${id}`, {
    nombre: payload.name,
    usuario: payload.username,
    telefono: payload.phone,
    correo: payload.email,
  });
}


export async function updateMyEmergencyContact(id, payload) {
  return httpClient.put(`/api/indigo/usuarios/${id}`, {
    contacto_nombre: payload.name,
    contacto_telefono: payload.phone,
    contacto_parentesco: payload.relation,
  });
}


export async function changeMyPassword(id, payload) {
  return httpClient.patch(`/api/indigo/usuarios/${id}/password`, {
    actual: payload.currentPassword,
    nueva: payload.newPassword,
  });
}


// Modulo "Personal" (Super usuario): da de alta/edita cualquier rol en
// cualquier sucursal, y registra quien lo hizo para la Bitacora.
function actorFields(actor) {
  return {
    realizado_por_nombre: actor?.name,
    realizado_por_rol: actor?.role,
    realizado_por_sucursal: actor?.branchName,
  };
}


export async function createPersonal(payload, actor) {
  return httpClient.post("/api/indigo/usuarios/personal", {
    nombre: payload.name,
    usuario: payload.username,
    telefono: payload.phone,
    correo: payload.email,
    rol: payload.role,
    sucursal_id: payload.branchId || null,
    requiere_cambio_password: payload.passwordChangeRequired,
    ...actorFields(actor),
  });
}


export async function updatePersonal(id, payload, actor) {
  return httpClient.put(`/api/indigo/usuarios/${id}`, {
    nombre: payload.name,
    usuario: payload.username,
    telefono: payload.phone,
    correo: payload.email,
    puesto: payload.role,
    sucursal_id: payload.branchId ?? null,
    ...actorFields(actor),
  });
}


export async function deactivatePersonal(id, actor) {
  return httpClient.patch(`/api/indigo/usuarios/${id}/deactivate`, actorFields(actor));
}


export async function activatePersonal(id, actor) {
  return httpClient.patch(`/api/indigo/usuarios/${id}/activate`, actorFields(actor));
}


export async function resetPersonalPassword(id, actor) {
  return httpClient.patch(`/api/indigo/usuarios/${id}/resetear-password`, actorFields(actor));
}


export async function deactivateUser(
  id
) {

  return httpClient.patch(`/api/indigo/usuarios/${id}/deactivate`);
}


export async function activateUser(
  id
) {

  return httpClient.patch(`/api/indigo/usuarios/${id}/activate`);
}

