import { createContext, useEffect, useState, type ReactNode } from "react";
import {
  getCurrentUser,
  logoutUser,
  type AuthUser,
} from "../services/auth.service";

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser(): Promise<AuthUser | null> {
  try {
    const result = await getCurrentUser();

    setUser(result.user);

    return result.user;
  } catch {
    setUser(null);

    return null;
  } finally {
    setLoading(false);
  }
}

 async function logout() {
  try {
    await logoutUser();
  } finally {
    setUser(null);
  }
}

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}