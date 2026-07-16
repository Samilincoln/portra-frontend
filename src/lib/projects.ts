import { API_BASE_URL, type AuthApiError } from "@/lib/auth";

export type ProjectStatus = "published" | "draft";

export type Project = {
  id: string;
  title: string;
  slug: string;
  category?: string | null;
  status: ProjectStatus;
  featured?: boolean;
  thumbnailUrl?: string | null;
  shortDescription?: string | null;
  problem?: string | null;
  solution?: string | null;
  architecture?: string | null;
  results?: string | null;
  technologies?: string[];
  tags?: string[];
  githubUrl?: string | null;
  liveDemoUrl?: string | null;
  screenshots?: string[];
  published?: boolean;
};

export type CreateProjectInput = {
  title: string;
  slug: string;
  shortDescription: string;
  problem?: string;
  solution?: string;
  architecture?: string;
  results?: string;
  technologies: string[];
  githubUrl?: string;
  liveDemoUrl?: string;
  category: string;
  tags: string[];
  featured: boolean;
  screenshots?: string[];
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

export async function listProjects(token: string | null): Promise<Project[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/projects`, {
    headers: authHeaders(token),
  });
  const data = await handle<Project[] | { projects: Project[] }>(res);
  return Array.isArray(data) ? data : (data.projects ?? []);
}

export async function createProject(
  token: string | null,
  input: CreateProjectInput,
): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/api/v1/projects`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return handle<Project>(res);
}

export async function getProject(
  token: string | null,
  id: string,
): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
    headers: authHeaders(token),
  });
  return handle<Project>(res);
}

export async function updateProject(
  token: string | null,
  id: string,
  input: Partial<CreateProjectInput> & { published?: boolean },
): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return handle<Project>(res);
}

export async function deleteProject(
  token: string | null,
  id: string,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) await handle(res);
}

export async function generateProjectSummary(
  token: string | null,
  id: string,
): Promise<{ shortDescription?: string; architecture?: string; solution?: string; problem?: string; results?: string }> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/projects/${id}/generate-summary`,
    { method: "POST", headers: authHeaders(token) },
  );
  return handle(res);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
