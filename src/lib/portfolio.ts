import { API_BASE_URL, type AuthApiError } from "@/lib/auth";
import type { Project } from "@/lib/projects";
import type { Skill } from "@/lib/skills";
import type { Experience } from "@/lib/experiences";
import type { BlogPost } from "@/lib/blog";
import type { Testimonial } from "@/lib/testimonials";

export class PortfolioNotFoundError extends Error {
  constructor(message = "Portfolio not found") {
    super(message);
    this.name = "PortfolioNotFoundError";
  }
}

export type PortfolioProfile = {
  username: string;
  name: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  resumeUrl?: string;
  bookingUrl?: string;
  industries?: string[];
  social?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  skills?: Skill[];
  experiences?: Experience[];
};

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
    } satisfies AuthApiError;
  }
  return data as T;
}

export async function getPortfolio(username: string): Promise<PortfolioProfile> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/portfolio/${encodeURIComponent(username)}`,
  );
  return handle<PortfolioProfile>(res);
}

export async function getPortfolioProjects(
  username: string,
): Promise<Project[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/portfolio/${encodeURIComponent(username)}/projects`,
  );
  const data = await handle<Project[] | { projects: Project[] }>(res);
  return Array.isArray(data) ? data : (data.projects ?? []);
}

export async function getPortfolioProject(
  username: string,
  slug: string,
): Promise<Project> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/portfolio/${encodeURIComponent(username)}/projects/${encodeURIComponent(slug)}`,
  );
  return handle<Project>(res);
}
