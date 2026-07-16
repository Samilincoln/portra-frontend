import { API_BASE_URL, type AuthApiError } from "@/lib/auth";

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

export async function listSkills(token: string | null): Promise<Skill[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/skills`, {
    headers: authHeaders(token),
  });
  const data = await handle<Skill[] | { skills: Skill[] }>(res);
  return Array.isArray(data) ? data : (data.skills ?? []);
}

export async function createSkill(
  token: string | null,
  input: SkillInput,
): Promise<Skill> {
  const res = await fetch(`${API_BASE_URL}/api/v1/skills`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return handle<Skill>(res);
}

export async function deleteSkill(
  token: string | null,
  id: string,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/skills/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) await handle(res);
}
