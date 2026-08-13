import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DraftInput = z.object({
  mode: z.enum(["draft", "redraft"]),
  projectId: z.string().optional(),
  context: z.string().trim().min(3),
  title: z.string().trim().optional(),
  existingContent: z.string().optional(),
  tone: z.string().trim().optional(),
  provider: z.string().trim().optional(),
  platform: z.enum(["blog", "linkedin", "twitter"]).default("blog"),
  token: z.string().optional(),
});

export type BlogDraft = {
  title: string;
  content: string;
  excerpt: string;
  provider: string;
  platform: string;
};

const ExperienceDescriptionInput = z.object({
  company: z.string().trim().min(1),
  role: z.string().trim().min(1),
  location: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  isCurrent: z.boolean().optional(),
  industry: z.string().trim().optional(),
  technologies: z.array(z.string()).optional(),
  achievements: z.string().trim().optional(),
  tone: z.enum(["professional", "casual", "technical"]).optional(),
  token: z.string().optional(),
});

export type ExperienceDescriptionDraft = {
  description: string;
  keywords: string[];
};

export const draftBlogPost = createServerFn({ method: "POST" })
  .validator((input: unknown) => DraftInput.parse(input))
  .handler(async ({ data }): Promise<BlogDraft> => {
    const baseUrl =
      process.env["VITE_API_BASE_URL"] ?? "http://localhost:8000";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (data.token) headers.Authorization = `Bearer ${data.token}`;

    const res = await fetch(`${baseUrl}/api/v1/blog/ai-draft`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        project_id: data.projectId ?? "",
        context:
          data.mode === "redraft"
            ? [
                `Rewrite and improve this draft post.`,
                data.title ? `Current title: ${data.title}` : "",
                data.tone ? `Tone: ${data.tone}` : "",
                `Author's context / instructions:\n${data.context}`,
                `Current draft:\n${data.existingContent?.slice(0, 12000) || "(empty)"}`,
              ]
                .filter(Boolean)
                .join("\n\n")
            : [
                `Write a new blog post (roughly 700-1000 words).`,
                data.title ? `Working title: ${data.title}` : "",
                data.tone ? `Tone: ${data.tone}` : "",
                `Context to base it on:\n${data.context}`,
              ]
                .filter(Boolean)
                .join("\n\n"),
        tone: data.tone ?? "professional",
        platform: data.platform,
        ...(data.provider ? { provider: data.provider } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `AI draft failed (${res.status}): ${body || res.statusText}`,
      );
    }

    const raw = await res.json();

    const content =
      typeof raw.content === "string"
        ? raw.content
        : typeof raw.content === "object" && raw.content !== null
          ? Object.values(raw.content).join("\n\n")
          : "";

    const result: BlogDraft = {
      title: raw.title ?? "",
      content,
      excerpt: raw.excerpt ?? "",
      provider: raw.provider ?? "",
      platform: raw.platform ?? data.platform,
    };
    return result;
  });

export const generateExperienceDescription = createServerFn({ method: "POST" })
  .validator((input: unknown) => ExperienceDescriptionInput.parse(input))
  .handler(async ({ data }): Promise<ExperienceDescriptionDraft> => {
    const baseUrl =
      process.env["VITE_API_BASE_URL"] ?? "http://localhost:8000";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (data.token) headers.Authorization = `Bearer ${data.token}`;

    const res = await fetch(`${baseUrl}/api/v1/experiences/ai-describe`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        company: data.company,
        role: data.role,
        location: data.location ?? "",
        start_date: data.startDate ?? "",
        end_date: data.endDate ?? null,
        is_current: data.isCurrent ?? false,
        industry: data.industry ?? "",
        technologies: data.technologies ?? [],
        achievements: data.achievements ?? "",
        tone: data.tone ?? "professional",
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `AI generation failed (${res.status}): ${body || res.statusText}`,
      );
    }

    const raw = await res.json();
    return {
      description: raw.description ?? "",
      keywords: raw.keywords ?? [],
    };
  });
