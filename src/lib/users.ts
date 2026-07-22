import { API_BASE_URL, type AuthApiError } from "@/lib/auth";

export type UserProfile = {
  id?: string;
  name?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  username?: string;
  customDomain?: string;
  theme?: string;
  social?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
};

function authHeaders(token: string | null): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function handle<T>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") ?? "";
  const data = ct.includes("application/json")
    ? await res.json().catch(() => ({}))
    : {};
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

export async function getMe(token: string | null): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
    headers: authHeaders(token),
  });
  return handle<UserProfile>(res);
}

export async function updateMe(
  token: string | null,
  input: Partial<UserProfile> & {
    currentPassword?: string;
    newPassword?: string;
  },
): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return handle<UserProfile>(res);
}

export async function deleteMe(token: string | null): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) await handle(res);
}
