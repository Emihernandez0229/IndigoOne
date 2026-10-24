import { httpClient } from "../../../shared/api/httpClient";


export async function listMermas() {
  return httpClient.get("/api/indigo/mermas");
}
