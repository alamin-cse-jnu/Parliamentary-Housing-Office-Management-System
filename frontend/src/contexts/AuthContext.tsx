import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { AppUser } from "../services/api";

interface AuthState {
  token: string | null;
  user: AppUser | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: AppUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadAuth(): AuthState {
  try {
    const token = localStorage.getItem("token");
    const raw = localStorage.getItem("user");
    const user: AppUser | null = raw ? JSON.parse(raw) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadAuth);

  const login = useCallback((token: string, user: AppUser) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setState({ token, user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setState({ token: null, user: null });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        isAuthenticated: !!state.token,
        isSuperAdmin: state.user?.role === "SUPER_ADMIN",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
