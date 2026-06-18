"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api } from "./api";

export type UserRole = "client" | "tailor" | "logistics";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  avatar_url: string | null;
  phone: string | null;
  auth_provider: string;
  gender: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  business_name: string | null;
  business_description: string | null;
  specializations: string | null;
  business_verified: boolean;
  company_name: string | null;
  fleet_size: string | null;
  service_regions: string | null;
  api_endpoint: string | null;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("bespoke_token");
    if (stored) {
      setToken(stored);
      api<{ id: string } & User>("/api/auth/me", { token: stored })
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem("bespoke_token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ access_token: string; user: User }>(
      "/api/auth/login",
      {
        method: "POST",
        body: { email, password },
      }
    );
    localStorage.setItem("bespoke_token", res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      role: UserRole
    ) => {
      const res = await api<{ access_token: string; user: User }>(
        "/api/auth/register",
        {
          method: "POST",
          body: { email, password, full_name: fullName, role },
        }
      );
      localStorage.setItem("bespoke_token", res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("bespoke_token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
