import { httpClient } from "../../../shared/api/httpClient";


export async function listClients() {
  return httpClient.get("/api/indigo/clientes");
}
