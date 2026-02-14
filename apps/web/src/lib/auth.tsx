import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/get-session", {
        credentials: "include",
      });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      if (data?.user) {
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message ?? "Giriş başarısız");
      }
      await fetchSession();
    },
    [fetchSession],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const res = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message ?? "Kayıt başarısız");
      }
      await fetchSession();
    },
    [fetchSession],
  );

  const logout = useCallback(async () => {
    // Clear local state first so the UI reacts immediately
    setUser(null);

    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Sign-out API may fail but we still want to clear local state
    }

    // Manually clear better-auth cookies with all possible path/domain combinations
    // (proxy may not forward Set-Cookie properly, and HttpOnly cookies can't be
    // cleared from JS — but we try anyway for non-HttpOnly ones)
    const cookieNames = [
      "better-auth.session_token",
      "better-auth.convex_jwt",
    ];
    const paths = ["/", "/api", "/api/auth"];
    const domains = [window.location.hostname, "", "localhost", "127.0.0.1"];
    for (const name of cookieNames) {
      for (const p of paths) {
        // Without domain
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${p};`;
        for (const d of domains) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${p}; domain=${d};`;
        }
      }
    }

    // Navigate via React Router — no full page reload.
    // This avoids fetchSession() re-running and finding stale HttpOnly cookies
    // that the proxy didn't properly clear via Set-Cookie headers.
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
