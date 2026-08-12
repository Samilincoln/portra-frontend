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

export async function listExperiences(
  token: string | null,
  params?: { skip?: number; limit?: number; profileId?: string }
): Promise<Experience[]> {
  const search = new URLSearchParams();
  if (params?.skip !== undefined) search.set("skip", String(params.skip));
  if (params?.limit !== undefined) search.set("limit", String(params.limit));
  if (params?.profileId) search.set("profile_id", params.profileId);

  const qs = search.toString();
  const data = await apiFetch<Experience[] | { experiences: Experience[] }>(
    `/api/v1/experiences${qs ? `?${qs}` : ""}`,
    token,
  );
  return Array.isArray(data) ? data : (data.experiences ?? []);
}

export async function createExperience(
  token: string | null,
  input: ExperienceInput,
  profileId?: string,
): Promise<Experience> {
  const params = new URLSearchParams();
  if (profileId) params.set("profile_id", profileId);
  const qs = params.toString();
  return apiFetch<Experience>(
    `/api/v1/experiences${qs ? `?${qs}` : ""}`,
    token,
    { method: "POST", body: input },
  );
}

export async function getExperience(
  token: string | null,
  id: string,
): Promise<Experience> {
  return apiFetch<Experience>(`/api/v1/experiences/${id}`, token);
}

export async function updateExperience(
  token: string | null,
  id: string,
  input: Partial<ExperienceInput>,
): Promise<Experience> {
  return apiFetch<Experience>(`/api/v1/experiences/${id}`, token, { method: "PATCH", body: input });
}

export async function deleteExperience(
  token: string | null,
  id: string,
): Promise<void> {
  await apiFetch(`/api/v1/experiences/${id}`, token, { method: "DELETE" });
}
