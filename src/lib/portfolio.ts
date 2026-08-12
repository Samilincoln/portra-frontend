import { API_BASE_URL } from "@/lib/auth";
import type { Project } from "@/lib/projects";
import type { Skill } from "@/lib/skills";
import type { Experience } from "@/lib/experiences";
import type { BlogPost } from "@/lib/blog";
import type { Testimonial } from "@/lib/testimonials";

export class PortfolioNotFoundError extends Error {
  constructor(message: string = "Portfolio not found") {
    super(message);
    this.name = "PortfolioNotFoundError";
  }
}

export type PortfolioProfile = {
  username: string;
  profileSlug?: string;
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

function resolveUrl(path: string): string {
  if (typeof window === "undefined" && API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  return path;
}

async function portfolioFetch<T>(
  path: string,
  options?: { method?: "GET" | "POST"; body?: unknown },
): Promise<T> {
  const url = resolveUrl(path);
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

async function demoModule(username: string) {
  const mod = await import("@/lib/portfolio-demo");
  return mod.isDemoUsername(username) ? mod : null;
}

function profileBase(username: string, profileSlug: string) {
  return `/api/v1/portfolio/public/${encodeURIComponent(username)}/${encodeURIComponent(profileSlug)}`;
}

export async function getPortfolio(
  username: string,
  profileSlug: string,
): Promise<PortfolioProfile> {
  const demo = await demoModule(username);
  if (demo) return { ...demo.DEMO_PROFILE, username };
  return portfolioFetch<PortfolioProfile>(profileBase(username, profileSlug));
}

export async function getPortfolioProjects(
  username: string,
  profileSlug: string,
): Promise<Project[]> {
  const demo = await demoModule(username);
  if (demo) return demo.DEMO_PROJECTS;
  const data = await portfolioFetch<Project[] | { projects: Project[] }>(
    `${profileBase(username, profileSlug)}/projects`,
  );
  return Array.isArray(data) ? data : (data.projects ?? []);
}

export async function getPortfolioProject(
  username: string,
  profileSlug: string,
  slug: string,
): Promise<Project> {
  const demo = await demoModule(username);
  if (demo) {
    const found = demo.DEMO_PROJECTS.find((p) => p.slug === slug);
    if (!found) throw new PortfolioNotFoundError("Project not found");
    return found;
  }
  return portfolioFetch<Project>(
    `${profileBase(username, profileSlug)}/projects/${encodeURIComponent(slug)}`,
  );
}

export async function getPortfolioExperiences(
  username: string,
  profileSlug: string,
): Promise<Experience[]> {
  const demo = await demoModule(username);
  if (demo) return demo.DEMO_EXPERIENCES;
  const data = await portfolioFetch<Experience[] | { experiences: Experience[] }>(
    `${profileBase(username, profileSlug)}/experiences`,
  );
  return Array.isArray(data) ? data : (data.experiences ?? []);
}

export async function getPortfolioTestimonials(
  username: string,
  profileSlug: string,
): Promise<Testimonial[]> {
  const demo = await demoModule(username);
  if (demo) return demo.DEMO_TESTIMONIALS;
  const data = await portfolioFetch<Testimonial[] | { testimonials: Testimonial[] }>(
    `${profileBase(username, profileSlug)}/testimonials`,
  );
  return Array.isArray(data) ? data : (data.testimonials ?? []);
}

export async function getPortfolioBlog(
  username: string,
  profileSlug: string,
): Promise<BlogPost[]> {
  const demo = await demoModule(username);
  if (demo) return demo.DEMO_BLOG;
  const data = await portfolioFetch<BlogPost[] | { posts: BlogPost[] }>(
    `${profileBase(username, profileSlug)}/blog`,
  );
  return Array.isArray(data) ? data : (data.posts ?? []);
}

export async function getPortfolioBlogPost(
  username: string,
  profileSlug: string,
  slug: string,
): Promise<BlogPost> {
  const demo = await demoModule(username);
  if (demo) {
    const found = demo.DEMO_BLOG.find((p) => p.slug === slug);
    if (!found) throw new PortfolioNotFoundError("Post not found");
    return found;
  }
  return portfolioFetch<BlogPost>(
    `${profileBase(username, profileSlug)}/blog/${encodeURIComponent(slug)}`,
  );
}

export type ContactInput = { name: string; email: string; message: string };

export async function submitContact(
  username: string,
  profileSlug: string,
  input: ContactInput,
): Promise<{ ok: true }> {
  const demo = await demoModule(username);
  if (demo) return { ok: true };
  return portfolioFetch<{ ok: true }>(
    `${profileBase(username, profileSlug)}/contact`,
    { method: "POST", body: input },
  );
}
