import { API_BASE_URL, type AuthApiError } from "@/lib/auth";

export type BlogStatus = "published" | "draft";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string | null;
  coverImage?: string | null;
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

function authHeaders(token: string | null): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function handle<T>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") ?? "";
  const data = ct.includes("application/json") ? await res.json().catch(() => ({})) : {};
  if (!res.ok) {
    throw {
      message: (data as { message?: string }).message ?? `Request failed (${res.status})`,
      fields: (data as { fields?: Record<string, string> }).fields,
    } satisfies AuthApiError;
  }
  return data as T;
}

export async function listBlogs(
  token: string | null,
  params?: { published_only?: boolean; skip?: number; limit?: number },
): Promise<BlogPost[]> {
  const search = new URLSearchParams();
  if (params?.published_only !== undefined)
    search.set("published_only", String(params.published_only));
  if (params?.skip !== undefined) search.set("skip", String(params.skip));
  if (params?.limit !== undefined) search.set("limit", String(params.limit));

  const res = await fetch(`${API_BASE_URL}/api/v1/blog?${search}`, {
    headers: authHeaders(token),
  });
  const data = await handle<BlogPost[] | { posts: BlogPost[] }>(res);
  return Array.isArray(data) ? data : (data.posts ?? []);
}

export async function getBlog(token: string | null, id: string): Promise<BlogPost> {
  const res = await fetch(`${API_BASE_URL}/api/v1/blog/${id}`, {
    headers: authHeaders(token),
  });
  return handle<BlogPost>(res);
}

export async function createBlog(token: string | null, input: BlogInput): Promise<BlogPost> {
  const res = await fetch(`${API_BASE_URL}/api/v1/blog`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return handle<BlogPost>(res);
}

export async function updateBlog(
  token: string | null,
  id: string,
  input: Partial<BlogInput>,
): Promise<BlogPost> {
  const res = await fetch(`${API_BASE_URL}/api/v1/blog/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return handle<BlogPost>(res);
}

export async function deleteBlog(token: string | null, id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/blog/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) await handle(res);
}

/**
 * Ask the backend to draft (or refine) a blog post from a topic/prompt.
 * Requires a matching `POST /api/v1/blog/generate` endpoint — pass the post
 * id when refining an existing draft so the backend has the current content
 * as context.
 */
export async function generateBlogDraft(
  token: string | null,
  input: { prompt: string; title?: string; existingContent?: string; id?: string },
): Promise<{ title?: string; content?: string; excerpt?: string; tags?: string[] }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/blog/generate`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return handle(res);
}

/**
 * Tiny, dependency-free markdown → HTML renderer.
 * Supports: headings (# .. ###), bold **x**, italic *x*, inline `code`,
 * links [t](u), code fences ```, unordered lists, blockquotes, paragraphs.
 */
export function renderMarkdown(md: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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
    x = x.replace(
      /`([^`]+)`/g,
      "<code class='rounded bg-muted px-1 py-0.5 text-[0.85em]'>$1</code>",
    );
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
