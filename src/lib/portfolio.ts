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
    if (res.status === 404) {
      throw new PortfolioNotFoundError(
        (data as { message?: string }).message ?? "Not found",
      );
    }
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

export async function getPortfolioExperiences(
  username: string,
): Promise<Experience[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/portfolio/${encodeURIComponent(username)}/experience`,
  );
  const data = await handle<Experience[] | { experiences: Experience[] }>(res);
  return Array.isArray(data) ? data : (data.experiences ?? []);
}

export async function getPortfolioTestimonials(
  username: string,
): Promise<Testimonial[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/portfolio/${encodeURIComponent(username)}/testimonials`,
  );
  const data = await handle<Testimonial[] | { testimonials: Testimonial[] }>(res);
  return Array.isArray(data) ? data : (data.testimonials ?? []);
}

export async function getPortfolioBlog(
  username: string,
): Promise<BlogPost[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/portfolio/${encodeURIComponent(username)}/blog`,
  );
  const data = await handle<BlogPost[] | { posts: BlogPost[] }>(res);
  return Array.isArray(data) ? data : (data.posts ?? []);
}

export async function getPortfolioBlogPost(
  username: string,
  slug: string,
): Promise<BlogPost> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/portfolio/${encodeURIComponent(username)}/blog/${encodeURIComponent(slug)}`,
  );
  return handle<BlogPost>(res);
}

export type ContactInput = { name: string; email: string; message: string };

export async function submitContact(
  username: string,
  input: ContactInput,
): Promise<{ ok: true }> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/portfolio/${encodeURIComponent(username)}/contact`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  return handle<{ ok: true }>(res);
}
