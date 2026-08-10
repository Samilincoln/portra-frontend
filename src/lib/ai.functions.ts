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
  token: z.string().optional(),
});

export type BlogDraft = {
  title: string;
  content: string;
  excerpt: string;
  provider: string;
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
    };
    return result;
  });
