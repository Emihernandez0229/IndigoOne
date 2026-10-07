import { httpClient } from "../../../shared/api/httpClient";

export async function getOpticasDashboardData() {
  return httpClient.get("/api/opticas/dashboard");
}
