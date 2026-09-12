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

