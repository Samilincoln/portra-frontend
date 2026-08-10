import { API_BASE_URL, apiFetch } from "@/lib/auth";
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

async function portfolioFetch<T>(
  path: string,
  options?: { method?: "GET" | "POST"; body?: unknown },
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: options?.method ?? "GET",
      headers: { "Content-Type": "application/json" },
      body: options?.body != null ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw { message: "Network error. Please try again." };
  }

  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
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
    };
  }
  return data as T;
}

export async function getPortfolio(username: string): Promise<PortfolioProfile> {
  return portfolioFetch<PortfolioProfile>(
    `/api/v1/portfolio/${encodeURIComponent(username)}`,
  );
}

export async function getPortfolioProjects(
  username: string,
): Promise<Project[]> {
  const data = await portfolioFetch<Project[] | { projects: Project[] }>(
    `/api/v1/portfolio/${encodeURIComponent(username)}/projects`,
  );
  return Array.isArray(data) ? data : (data.projects ?? []);
}

export async function getPortfolioProject(
  username: string,
  slug: string,
): Promise<Project> {
  return portfolioFetch<Project>(
    `/api/v1/portfolio/${encodeURIComponent(username)}/projects/${encodeURIComponent(slug)}`,
  );
}

export async function getPortfolioExperiences(
  username: string,
): Promise<Experience[]> {
  const data = await portfolioFetch<Experience[] | { experiences: Experience[] }>(
    `/api/v1/portfolio/${encodeURIComponent(username)}/experience`,
  );
  return Array.isArray(data) ? data : (data.experiences ?? []);
}

export async function getPortfolioTestimonials(
  username: string,
): Promise<Testimonial[]> {
  const data = await portfolioFetch<Testimonial[] | { testimonials: Testimonial[] }>(
    `/api/v1/portfolio/${encodeURIComponent(username)}/testimonials`,
  );
  return Array.isArray(data) ? data : (data.testimonials ?? []);
}

export async function getPortfolioBlog(
  username: string,
): Promise<BlogPost[]> {
  const data = await portfolioFetch<BlogPost[] | { posts: BlogPost[] }>(
    `/api/v1/portfolio/${encodeURIComponent(username)}/blog`,
  );
  return Array.isArray(data) ? data : (data.posts ?? []);
}

export async function getPortfolioBlogPost(
  username: string,
  slug: string,
): Promise<BlogPost> {
  return portfolioFetch<BlogPost>(
    `/api/v1/portfolio/${encodeURIComponent(username)}/blog/${encodeURIComponent(slug)}`,
  );
}

export type ContactInput = { name: string; email: string; message: string };

export async function submitContact(
  username: string,
  input: ContactInput,
): Promise<{ ok: true }> {
  return portfolioFetch<{ ok: true }>(
    `/api/v1/portfolio/${encodeURIComponent(username)}/contact`,
    { method: "POST", body: input },
  );
}
