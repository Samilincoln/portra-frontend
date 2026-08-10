import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  username?: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (payload: { token: string; user?: AuthUser | null }) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = "portra_auth";

function loadStoredAuth(): { token: string | null; user: AuthUser | null } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { token: parsed.token ?? null, user: parsed.user ?? null };
    }
  } catch {
    // ignore parse errors
  }
  return { token: null, user: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const { token: storedToken, user: storedUser } = loadStoredAuth();
    setToken(storedToken);
    setUser(storedUser);
    setHydrated(true);
  }, []);

  const setSession = useCallback(
    ({ token: t, user: u }: { token: string; user?: AuthUser | null }) => {
      setToken(t);
      setUser(u ?? null);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, user: u ?? null }));
      } catch {
        // ignore storage errors
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
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

  // Always provide context (with null values during SSR/hydration) to avoid "useAuth must be used within AuthProvider"
  const contextValue = hydrated ? value : { ...value, token: null, user: null, isAuthenticated: false };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export type AuthApiError = { message: string; fields?: Record<string, string> };

let _redirecting = false;

function redirectToLogin() {
  if (_redirecting) return;
  _redirecting = true;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  window.location.href = "/login";
}

function getAuthHeaders(token: string | null): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function apiFetch<T = unknown>(
  path: string,
  token: string | null,
  options?: { method?: "POST" | "GET" | "PATCH" | "DELETE"; body?: unknown },
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: options?.method ?? "GET",
      headers: getAuthHeaders(token),
      body: options?.method === "GET" ? undefined : JSON.stringify(options?.body),
    });
  } catch {
    throw { message: "Network error. Please try again." } satisfies AuthApiError;
  }

  if (res.status === 401) {
    redirectToLogin();
    throw { message: "Session expired. Redirecting to login…" } satisfies AuthApiError;
  }

  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => ({}))
    : {};

  if (!res.ok) {
    throw {
      message:
        (data as { message?: string }).message ?? `Request failed (${res.status})`,
      fields: (data as { fields?: Record<string, string> }).fields,
    } satisfies AuthApiError;
  }
  return data as T;
}

export async function authFetch<T = unknown>(
  path: string,
  body: unknown,
  options?: { token?: string | null; method?: "POST" | "GET" | "PATCH" | "DELETE" },
): Promise<T> {
  return apiFetch<T>(path, options?.token ?? null, {
    method: options?.method ?? "POST",
    body,
  });
}