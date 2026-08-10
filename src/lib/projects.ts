import { apiFetch } from "@/lib/auth";

export type ProjectStatus = "published" | "draft";

export type ProjectTechnology = {
  id: string;
  name: string;
  icon: string;
  category: string;
  created_at: string;
};

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
  description?: string | null;
  github_url?: string | null;
  demo_url?: string | null;
  thumbnail?: string | null;
  technology_ids?: string[];
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  technologies_detail?: ProjectTechnology[];
  meta_title?: string | null;
  meta_description?: string | null;
};

function normalizeTechnologies(techs: unknown): string[] {
  if (!Array.isArray(techs)) return [];
  return techs.map((t) =>
    typeof t === "string" ? t : t?.name ?? String(t),
  );
}

export function normalizeProject(raw: Project): Project {
  return {
    ...raw,
    shortDescription: raw.shortDescription ?? raw.description ?? null,
    githubUrl: raw.githubUrl ?? raw.github_url ?? null,
    liveDemoUrl: raw.liveDemoUrl ?? raw.demo_url ?? null,
    thumbnailUrl: raw.thumbnailUrl ?? raw.thumbnail ?? null,
    technologies: normalizeTechnologies(raw.technologies) ||
      normalizeTechnologies(raw.technologies_detail?.map((t) => t.name)) ||
      [],
  };
}

function toSnakeCasePayload(input: Record<string, unknown>): Record<string, unknown> {
  return {
    title: input.title,
    slug: input.slug,
    description: input.shortDescription,
    problem: input.problem,
    solution: input.solution,
    architecture: input.architecture,
    results: input.results,
    technologies: input.technologies,
    github_url: input.githubUrl,
    demo_url: input.liveDemoUrl,
    category: input.category,
    tags: input.tags,
    featured: input.featured,
    screenshots: input.screenshots,
    published: input.published,
  };
}

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

export async function listProjects(token: string | null): Promise<Project[]> {
  const data = await apiFetch<Project[] | { projects: Project[] }>("/api/v1/projects", token);
  const projects = Array.isArray(data) ? data : (data.projects ?? []);
  return projects.map(normalizeProject);
}

export async function createProject(
  token: string | null,
  input: CreateProjectInput,
): Promise<Project> {
  const data = await apiFetch<Project | { project: Project }>("/api/v1/projects", token, {
    method: "POST",
    body: toSnakeCasePayload(input as unknown as Record<string, unknown>),
  });
  const project = data && "project" in data ? (data as { project: Project }).project : data as Project;
  return normalizeProject(project);
}

export async function getProject(
  token: string | null,
  id: string,
): Promise<Project> {
  const data = await apiFetch<Project | { project: Project }>(`/api/v1/projects/${id}`, token);
  const project = data && "project" in data ? (data as { project: Project }).project : data as Project;
  return normalizeProject(project);
}

export async function updateProject(
  token: string | null,
  id: string,
  input: Partial<CreateProjectInput> & { published?: boolean },
): Promise<Project> {
  const data = await apiFetch<Project | { project: Project }>(`/api/v1/projects/${id}`, token, {
    method: "PATCH",
    body: toSnakeCasePayload(input as unknown as Record<string, unknown>),
  });
  const project = data && "project" in data ? (data as { project: Project }).project : data as Project;
  return normalizeProject(project);
}

export async function deleteProject(
  token: string | null,
  id: string,
): Promise<void> {
  await apiFetch(`/api/v1/projects/${id}`, token, { method: "DELETE" });
}

export async function generateProjectSummary(
  token: string | null,
  id: string,
): Promise<{ shortDescription?: string; architecture?: string; solution?: string; problem?: string; results?: string }> {
  return apiFetch(`/api/v1/projects/${id}/generate-summary`, token, { method: "POST" });
}

export async function generateFromGithub(
  token: string | null,
  githubUrl: string,
  projectId?: string,
): Promise<{
  title: string;
  description: string;
  problem: string;
  solution: string;
  results: string;
  architecture: string;
  technologies: string[];
  tags: string[];
}> {
  return apiFetch("/api/v1/projects/ai-summary", token, {
    method: "POST",
    body: { github_url: githubUrl, ...(projectId ? { project_id: projectId } : {}) },
  });
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
