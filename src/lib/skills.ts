import { apiFetch } from "@/lib/auth";

export type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Proficient" | "Expert";

export const SKILL_LEVELS: SkillLevel[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Proficient",
  "Expert",
];

export const SKILL_LEVEL_VALUES: Record<SkillLevel, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Proficient: 4,
  Expert: 5,
};

export type Skill = {
  id: string;
  name: string;
  category: string;
  level: number;
};

export type SkillInput = Omit<Skill, "id">;

export async function listSkills(
  profileId?: string,
): Promise<Skill[]> {
  const params = new URLSearchParams();
  if (profileId) params.set("profile_id", profileId);
  const qs = params.toString();
  const data = await apiFetch<Skill[] | { skills: Skill[] }>(
    `/api/v1/skills${qs ? `?${qs}` : ""}`,
  );
  return Array.isArray(data) ? data : (data.skills ?? []);
}

export async function createSkill(
  input: SkillInput,
  profileId?: string,
): Promise<Skill> {
  const params = new URLSearchParams();
  if (profileId) params.set("profile_id", profileId);
  const qs = params.toString();
  return apiFetch<Skill>(
    `/api/v1/skills${qs ? `?${qs}` : ""}`,
    { method: "POST", body: input },
  );
}

export async function deleteSkill(
  id: string,
): Promise<void> {
  await apiFetch(`/api/v1/skills/${id}`, { method: "DELETE" });
}

export async function updateSkill(
  id: string,
  input: Partial<SkillInput>,
): Promise<Skill> {
  return apiFetch<Skill>(`/api/v1/skills/${id}`, {
    method: "PATCH",
    body: input,
  });
}
