import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [police, setPolice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("policeToken");
    const storedUser = localStorage.getItem("policeUser");
    if (token && storedUser) {
      try {
        setPolice(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("policeToken");
        localStorage.removeItem("policeUser");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    const { token, user } = await api.login(username, password);
    localStorage.setItem("policeToken", token);
    localStorage.setItem("policeUser", JSON.stringify(user));
    setPolice(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("policeToken");
    localStorage.removeItem("policeUser");
    setPolice(null);
  }, []);

  return (
    <AuthContext.Provider value={{ police, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
