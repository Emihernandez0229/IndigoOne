import {
  createContext,
  useContext,
  useState,
} from "react";

import {
  loginRequest,
  readStoredSession,
  clearStoredSession,
} from "../services/authService";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {

  const [user, setUser] = useState(
    () => readStoredSession()?.user ?? null
  );

  const [initializing] = useState(false);

  const [loading, setLoading] = useState(false);


  async function login(credentials) {

    setLoading(true);

    try {

      const response = await loginRequest(credentials);

      setUser(response.user);

      return response;

    } finally {

      setLoading(false);

    }

  }


  function logout() {

    clearStoredSession();

    setUser(null);

  }


  return (

    <AuthContext.Provider
      value={{
        user,
        initializing,
        loading,
        isAuthenticated: Boolean(user),
        login,
        logout,
      }}
    >

      {children}

    </AuthContext.Provider>

  );

}


// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {

  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }

  return context;

}
