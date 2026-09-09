import { getToken } from "../services/sessionStorage";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // El back siempre regresa JSON, hasta en los errores
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.error ?? "Ocurrió un error inesperado");
    error.status = response.status;
    throw error;
  }
  return data;
}

export const httpClient = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
};