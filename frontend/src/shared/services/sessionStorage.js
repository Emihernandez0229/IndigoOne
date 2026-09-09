const STORAGE_KEY = "indigo_one.session";


export function persistSession(session, remember = true) {
  try {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {

  }
}

export function readStoredSession() {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      sessionStorage.getItem(STORAGE_KEY);

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStoredSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // sin accion
  }
}

export function getToken() {
  return readStoredSession()?.token ?? null;
}