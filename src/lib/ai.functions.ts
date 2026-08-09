import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const DraftInput = z.object({
  mode: z.enum(["draft", "redraft"]),
  context: z.string().trim().min(3),
  title: z.string().trim().optional(),
  existingContent: z.string().optional(),
  tone: z.string().trim().optional(),
});

export type BlogDraft = { title: string; content: string };

export const draftBlogPost = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => DraftInput.parse(input))
  .handler(async ({ data }): Promise<BlogDraft> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const gateway = createLovableAiGatewayProvider(key);

    const system = [
      "You are an expert technical writing assistant for AI and backend engineers.",
      "You write clear, specific, non-fluffy blog posts in Markdown.",
      "Never use emojis. Use headings, short paragraphs, lists and code fences where useful.",
      "Respond in EXACTLY this format:",
      "TITLE: <one-line title>",
      "---",
      "<full markdown body, no top-level H1 repeating the title>",
    ].join("\n");

    const prompt =
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
            .join("\n\n");

    const result = streamText({
      model: gateway("google/gemini-3.6-flash"),
      system,
      prompt,
    });

    const text = await result.text;
    const match = /^\s*TITLE:\s*(.+?)\s*\n-{3,}\s*\n([\s\S]*)$/.exec(text);
    if (match) {
      return { title: match[1].trim(), content: match[2].trim() };
    }
    return { title: data.title ?? "", content: text.trim() };
  });
