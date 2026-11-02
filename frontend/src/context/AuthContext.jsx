import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("diamond_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("diamond_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then(({ data }) => {
        setUser(data);
        localStorage.setItem("diamond_user", JSON.stringify(data));
      })
      .catch(() => {
        localStorage.removeItem("diamond_token");
        localStorage.removeItem("diamond_user");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("diamond_token", data.token);
    localStorage.setItem("diamond_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function register(fullName, email, password) {
    const { data } = await api.post("/auth/register", {
      full_name: fullName,
      email,
      password,
    });
    return data;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // token may already be invalid — clear local state regardless
    }
    localStorage.removeItem("diamond_token");
    localStorage.removeItem("diamond_user");
    setUser(null);
  }

  const role = user?.role?.name ?? null;

  return (
    <AuthContext.Provider value={{ user, role, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
