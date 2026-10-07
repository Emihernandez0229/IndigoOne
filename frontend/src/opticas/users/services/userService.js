import { httpClient } from "../../../shared/api/httpClient";
export async function listUsers() {
  return httpClient.get(
    "/api/opticas/usuarios"
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
    `/api/opticas/usuarios/opciones-formulario${query}`
  );
}


export async function createUser(
  payload
) {
  switch (payload.role) {

    case "OPTICA_BRANCH_MANAGER":
      return httpClient.post("/api/opticas/usuarios/gerentes",
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

    case "OPTICA_SALES":
      return httpClient.post("/api/opticas/usuarios/empleados",
        {
          nombre:
            payload.name,
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

  return httpClient.put(`/api/opticas/usuarios/${id}`,
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

  return httpClient.patch(`/api/opticas/usuarios/${id}/deactivate`);
}


export async function activateUser(
  id
) {

  return httpClient.patch(`/api/opticas/usuarios/${id}/activate`);
}

