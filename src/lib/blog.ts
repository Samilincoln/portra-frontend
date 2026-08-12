import { apiFetch } from "@/lib/auth";

export type BlogStatus = "published" | "draft";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string | null;
  coverImage?: string | null;
  coverImageUrl?: string | null;
  cover_image?: string | null;

  tags?: string[];
  status?: "published" | "draft";
  published?: boolean;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  views?: number;
};

export type BlogInput = {
  title: string;
  slug: string;
  content: string;
  coverImageUrl?: string | null;
  tags?: string[];
  status: BlogStatus;
};

export async function listBlogs(
  token: string | null,
  params?: { published_only?: boolean; skip?: number; limit?: number; profileId?: string }
): Promise<BlogPost[]> {
  const search = new URLSearchParams();
  if (params?.published_only !== undefined) search.set("published_only", String(params.published_only));
  if (params?.skip !== undefined) search.set("skip", String(params.skip));
  if (params?.limit !== undefined) search.set("limit", String(params.limit));
  if (params?.profileId) search.set("profile_id", params.profileId);

  const qs = search.toString();
  const data = await apiFetch<BlogPost[] | { posts: BlogPost[] }>(
    `/api/v1/blog${qs ? `?${qs}` : ""}`,
    token,
  );
  return Array.isArray(data) ? data : (data.posts ?? []);
}

export async function getBlog(
  token: string | null,
  id: string,
): Promise<BlogPost> {
  return apiFetch<BlogPost>(`/api/v1/blog/${id}`, token);
}

export async function createBlog(
  token: string | null,
  input: BlogInput,
  profileId?: string,
): Promise<BlogPost> {
  const params = new URLSearchParams();
  if (profileId) params.set("profile_id", profileId);
  const qs = params.toString();
  return apiFetch<BlogPost>(
    `/api/v1/blog${qs ? `?${qs}` : ""}`,
    token,
    { method: "POST", body: input },
  );
}

export async function updateBlog(
  token: string | null,
  id: string,
  input: Partial<BlogInput>,
): Promise<BlogPost> {
  return apiFetch<BlogPost>(`/api/v1/blog/${id}`, token, { method: "PATCH", body: input });
}

export async function deleteBlog(
  token: string | null,
  id: string,
): Promise<void> {
  await apiFetch(`/api/v1/blog/${id}`, token, { method: "DELETE" });
}

/**
 * Tiny, dependency-free markdown → HTML renderer.
 * Supports: headings (# .. ###), bold **x**, italic *x*, inline `code`,
 * links [t](u), code fences ```, unordered lists, blockquotes, paragraphs.
 */
export function renderMarkdown(md: string): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let listBuf: string[] = [];
  let paraBuf: string[] = [];

  const flushList = () => {
    if (listBuf.length) {
      out.push(
        "<ul class='list-disc pl-5 space-y-1'>" +
          listBuf.map((l) => `<li>${inline(l)}</li>`).join("") +
          "</ul>",
      );
      listBuf = [];
    }
  };
  const flushPara = () => {
    if (paraBuf.length) {
      out.push(`<p>${inline(paraBuf.join(" "))}</p>`);
      paraBuf = [];
    }
  };

  const inline = (s: string) => {
    let x = esc(s);
    x = x.replace(/`([^`]+)`/g, "<code class='rounded bg-muted px-1 py-0.5 text-[0.85em]'>$1</code>");
    x = x.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    x = x.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
    x = x.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      "<a href='$2' class='text-accent underline' target='_blank' rel='noreferrer'>$1</a>",
    );
    return x;
  };

  for (const raw of lines) {
    const line = raw;
    if (line.trim().startsWith("```")) {
      flushPara();
      flushList();
      if (inCode) {
        out.push(
          `<pre class='rounded-lg bg-muted p-3 text-xs overflow-x-auto'><code>${esc(codeBuf.join("\n"))}</code></pre>`,
        );
        codeBuf = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      flushList();
      const level = h[1].length;
      const sizes = ["text-2xl", "text-xl", "text-lg"];
      out.push(
        `<h${level} class='${sizes[level - 1]} font-semibold tracking-tight mt-4 mb-2'>${inline(h[2])}</h${level}>`,
      );
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      listBuf.push(line.replace(/^\s*[-*]\s+/, ""));
      continue;
    }
    if (/^\s*>\s+/.test(line)) {
      flushPara();
      flushList();
      out.push(
        `<blockquote class='border-l-2 border-accent pl-3 italic text-muted-foreground'>${inline(line.replace(/^\s*>\s+/, ""))}</blockquote>`,
      );
      continue;
    }
    if (line.trim() === "") {
      flushPara();
      flushList();
      continue;
    }
    paraBuf.push(line);
  }
  flushPara();
  flushList();
  if (inCode && codeBuf.length) {
    out.push(
      `<pre class='rounded-lg bg-muted p-3 text-xs overflow-x-auto'><code>${esc(codeBuf.join("\n"))}</code></pre>`,
    );
  }
  return out.join("\n");
}
