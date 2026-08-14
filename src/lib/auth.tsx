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
  subscriptionTier?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  isVerified?: boolean;
};

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  setSession: (payload: { user?: AuthUser | null }) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

let _redirecting = false;

function redirectToLogin() {
  if (_redirecting) return;
  _redirecting = true;
  window.location.href = "/login";
}

let _refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL || ""}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL || ""}/api/v1/auth/me`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("not authenticated");
      })
      .then((data) => {
        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          avatarUrl: data.avatar_url ?? data.avatarUrl,
          username: data.username,
          subscriptionTier: data.subscription_tier ?? data.subscriptionTier,
          isAdmin: data.is_admin ?? data.isAdmin,
          isActive: data.is_active ?? data.isActive,
          isVerified: data.is_verified ?? data.isVerified,
        });
        setIsAuthenticated(true);
      })
      .catch(() => {
        setUser(null);
        setIsAuthenticated(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const setSession = useCallback(
    ({ user: u }: { user?: AuthUser | null }) => {
      setUser(u ?? null);
      setIsAuthenticated(Boolean(u));
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL || ""}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // proceed with client-side cleanup even if server call fails
    }
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = "/login";
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated,
      loading,
      setSession,
      logout,
    }),
    [user, isAuthenticated, loading, setSession, logout],
  );

  const contextValue = loading
    ? { ...value, user: null, isAuthenticated: false }
    : value;

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export type AuthApiError = { message: string; fields?: Record<string, string> };

export async function apiFetch<T = unknown>(
  path: string,
  options?: { method?: "POST" | "GET" | "PATCH" | "DELETE"; body?: unknown; _retried?: boolean },
): Promise<T> {
  const url = typeof window === "undefined" && API_BASE_URL
    ? `${API_BASE_URL}${path}`
    : path;

  let res: Response;
  try {
    res = await fetch(url, {
      method: options?.method ?? "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: options?.method === "GET" ? undefined : JSON.stringify(options?.body),
    });
  } catch {
    throw { message: "Network error. Please try again." } satisfies AuthApiError;
  }

  // Auto-refresh on 401
  if (res.status === 401 && !options?._retried && !path.includes("/auth/")) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, _retried: true });
    }
    redirectToLogin();
    throw { message: "Session expired. Redirecting to login…" } satisfies AuthApiError;
  }

  if (res.status === 401 && !path.includes("/auth/")) {
    redirectToLogin();
    throw { message: "Session expired. Redirecting to login…" } satisfies AuthApiError;
  }

  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => ({}))
    : {};

  if (!res.ok) {
    const detail = (data as { detail?: Array<{ msg?: string; loc?: string[] }> }).detail;
    const detailMsg = detail?.map((d) => d.msg).join(", ");
    throw {
      message:
        detailMsg ??
        (data as { message?: string }).message ??
        `Request failed (${res.status})`,
      fields: (data as { fields?: Record<string, string> }).fields,
    } satisfies AuthApiError;
  }
  return data as T;
}

export async function authFetch<T = unknown>(
  path: string,
  body: unknown,
  options?: { method?: "POST" | "GET" | "PATCH" | "DELETE" },
): Promise<T> {
  return apiFetch<T>(path, {
    method: options?.method ?? "POST",
    body,
  });
}
