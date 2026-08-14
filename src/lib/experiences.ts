import { apiFetch } from "@/lib/auth";

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

function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    if (typeof value === "string" && /^\d{4}-\d{2}(-\d{2})?$/.test(value)) {
      result[snakeKey] = `${value.slice(0, 7)}-01T00:00:00Z`;
    } else {
      result[snakeKey] = value;
    }
  }
  return result;
}

function toCamelCase(obj: Record<string, unknown>): Experience {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result as Experience;
}

function safeToCamelCase(item: unknown): Experience | null {
  if (!item || typeof item !== "object") return null;
  return toCamelCase(item as Record<string, unknown>);
}

export async function listExperiences(
  params?: { skip?: number; limit?: number; profileId?: string }
): Promise<Experience[]> {
  const search = new URLSearchParams();
  if (params?.skip !== undefined) search.set("skip", String(params.skip));
  if (params?.limit !== undefined) search.set("limit", String(params.limit));
  if (params?.profileId) search.set("profile_id", params.profileId);

  const qs = search.toString();
  const raw = await apiFetch<unknown>(
    `/api/v1/experiences${qs ? `?${qs}` : ""}`,
  );

  let items: unknown[];
  if (Array.isArray(raw)) {
    items = raw;
  } else if (raw && typeof raw === "object" && "experiences" in raw && Array.isArray((raw as { experiences: unknown }).experiences)) {
    items = (raw as { experiences: unknown[] }).experiences;
  } else {
    items = [];
  }

  return items.map((item) => toCamelCase(item as Record<string, unknown>));
}

export async function createExperience(
  input: ExperienceInput,
  profileId?: string,
): Promise<Experience> {
  const params = new URLSearchParams();
  if (profileId) params.set("profile_id", profileId);
  const qs = params.toString();
  const res = await apiFetch<Experience>(
    `/api/v1/experiences${qs ? `?${qs}` : ""}`,
    { method: "POST", body: toSnakeCase(input as Record<string, unknown>) },
  );
  return toCamelCase(res as unknown as Record<string, unknown>);
}

export async function getExperience(
  id: string,
): Promise<Experience> {
  const res = await apiFetch<Experience>(`/api/v1/experiences/${id}`);
  return toCamelCase(res as unknown as Record<string, unknown>);
}

export async function updateExperience(
  id: string,
  input: Partial<ExperienceInput>,
): Promise<Experience> {
  const res = await apiFetch<Experience>(`/api/v1/experiences/${id}`, { method: "PATCH", body: toSnakeCase(input as Record<string, unknown>) });
  return toCamelCase(res as unknown as Record<string, unknown>);
}

export async function deleteExperience(
  id: string,
): Promise<void> {
  await apiFetch(`/api/v1/experiences/${id}`, { method: "DELETE" });
}
