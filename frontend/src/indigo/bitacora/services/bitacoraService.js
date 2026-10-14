import { httpClient } from "../../../shared/api/httpClient";


export async function listBitacora() {
  return httpClient.get("/api/indigo/bitacora");
}
