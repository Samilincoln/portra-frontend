import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export type AuthUser = {
  id?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (payload: { token: string; user?: AuthUser | null }) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const setSession = useCallback(
    ({ token: t, user: u }: { token: string; user?: AuthUser | null }) => {
      setToken(t);
      setUser(u ?? null);
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      setSession,
      logout,
    }),
    [token, user, setSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export type AuthApiError = { message: string; fields?: Record<string, string> };

export async function authFetch<T = unknown>(
  path: string,
  body: unknown,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw { message: "Network error. Please try again." } satisfies AuthApiError;
  }

  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => ({}))
    : {};

  console.log("API Response:", { path, status: res.status, data });

  if (!res.ok) {
    throw {
      message:
        (data as { message?: string }).message ??
        `Request failed (${res.status})`,
      fields: (data as { fields?: Record<string, string> }).fields,
    } satisfies AuthApiError;
  }
  return data as T;
}
