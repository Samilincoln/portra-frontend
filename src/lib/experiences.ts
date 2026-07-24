import { API_BASE_URL, type AuthApiError } from "@/lib/auth";

export type Experience = {
  id: string;
  company: string;
  role: string;
  location?: string | null;
  description?: string | null;
  startDate: string; // ISO YYYY-MM
  endDate?: string | null; // null = Present
  isCurrent?: boolean;
  companyUrl?: string | null;
  logoUrl?: string | null;
  displayOrder?: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ExperienceInput = Omit<Experience, "id">;

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

export async function listExperiences(
  token: string | null,
  params?: { skip?: number; limit?: number }
): Promise<Experience[]> {
  const search = new URLSearchParams();
  if (params?.skip !== undefined) search.set("skip", String(params.skip));
  if (params?.limit !== undefined) search.set("limit", String(params.limit));

  const res = await fetch(`${API_BASE_URL}/api/v1/experiences?${search}`, {
    headers: authHeaders(token),
  });
  const data = await handle<Experience[] | { experiences: Experience[] }>(res);
  return Array.isArray(data) ? data : (data.experiences ?? []);
}

export async function createExperience(
  token: string | null,
  input: ExperienceInput,
): Promise<Experience> {
  const res = await fetch(`${API_BASE_URL}/api/v1/experiences`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return handle<Experience>(res);
}

export async function getExperience(
  token: string | null,
  id: string,
): Promise<Experience> {
  const res = await fetch(`${API_BASE_URL}/api/v1/experiences/${id}`, {
    headers: authHeaders(token),
  });
  return handle<Experience>(res);
}

export async function updateExperience(
  token: string | null,
  id: string,
  input: Partial<ExperienceInput>,
): Promise<Experience> {
  const res = await fetch(`${API_BASE_URL}/api/v1/experiences/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return handle<Experience>(res);
}

export async function deleteExperience(
  token: string | null,
  id: string,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/experiences/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) await handle(res);
}
