import { apiFetch } from "@/lib/auth";

export type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";

export const SKILL_LEVELS: SkillLevel[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
];

export type Skill = {
  id: string;
  name: string;
  category: string;
  level: SkillLevel;
};

export type SkillInput = Omit<Skill, "id">;

export async function listSkills(
  token: string | null,
  profileId?: string,
): Promise<Skill[]> {
  const params = new URLSearchParams();
  if (profileId) params.set("profile_id", profileId);
  const qs = params.toString();
  const data = await apiFetch<Skill[] | { skills: Skill[] }>(
    `/api/v1/skills${qs ? `?${qs}` : ""}`,
    token,
  );
  return Array.isArray(data) ? data : (data.skills ?? []);
}

export async function createSkill(
  token: string | null,
  input: SkillInput,
  profileId?: string,
): Promise<Skill> {
  const params = new URLSearchParams();
  if (profileId) params.set("profile_id", profileId);
  const qs = params.toString();
  return apiFetch<Skill>(
    `/api/v1/skills${qs ? `?${qs}` : ""}`,
    token,
    { method: "POST", body: input },
  );
}

export async function deleteSkill(
  token: string | null,
  id: string,
): Promise<void> {
  await apiFetch(`/api/v1/skills/${id}`, token, { method: "DELETE" });
}
