import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/lib/auth";
import { slugify } from "@/lib/projects";
import { AiBlogAssistant } from "@/components/dashboard/AiBlogAssistant";

import {
  createBlog,
  renderMarkdown,
  updateBlog,
  type BlogInput,
  type BlogPost,
} from "@/lib/blog";

type Props = { existing?: BlogPost };

const schema = z.object({
  title: z.string().trim().min(2, "Title is required").max(160),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and dashes"),
  content: z.string().trim().min(1, "Write something before saving"),
});

export function BlogEditor({ existing }: Props) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [title, setTitle] = useState(existing?.title ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(existing?.slug));
  const [coverImageUrl, setCoverImageUrl] = useState(
    existing?.coverImageUrl ?? "",
  );
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [content, setContent] = useState(existing?.content ?? "");
  const [published, setPublished] = useState(existing?.status === "published");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const autoSlug = useMemo(() => slugify(title), [title]);

  useEffect(() => {
    if (!slugTouched) setSlug(autoSlug);
  }, [autoSlug, slugTouched]);

  const previewHtml = useMemo(() => renderMarkdown(content), [content]);

  const mutation = useMutation({
    mutationFn: (input: BlogInput) =>
      existing
        ? updateBlog(token, existing.id, input)
        : createBlog(token, input),
    onSuccess: (data) => {
      toast.success(existing ? "Post updated" : "Post created");
      qc.invalidateQueries({ queryKey: ["blogs"] });
      if (!existing) {
        navigate({ to: "/dashboard/blog/$id/edit", params: { id: data.id } });
      }
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not save"),
  });

  function save(nextStatus: "draft" | "published") {
    const payload: BlogInput = {
      title,
      slug: slug || autoSlug,
      content,
      coverImageUrl: coverImageUrl || null,
      tags,
      status: nextStatus,
    };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) {
        const k = i.path[0] as string;
        if (k && !fe[k]) fe[k] = i.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});
    setPublished(nextStatus === "published");
    mutation.mutate(payload);
  }

  function onTagKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const parts = tagInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length) {
        setTags(Array.from(new Set([...tags, ...parts])));
        setTagInput("");
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            to="/dashboard/blog"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to blog
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {existing ? "Edit post" : "New post"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AiBlogAssistant
            title={title}
            content={content}
            onApply={({ title: t, content: c }) => {
              if (t) setTitle(t);
              setContent(c);
            }}
          />
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-soft">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {published ? "Published" : "Draft"}
            </span>
            <Switch
              checked={published}
              onCheckedChange={(v) => setPublished(v)}
            />
          </div>

          <Button
            variant="outline"
            onClick={() => save("draft")}
            disabled={mutation.isPending}
          >
            Save draft
          </Button>
          <Button
            onClick={() => save("published")}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Publishing…
              </>
            ) : (
              "Publish"
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="How I built a realtime vector index in Rust"
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Slug</Label>
          <Input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder={autoSlug || "my-post"}
          />
          {errors.slug && (
            <p className="text-xs text-destructive">{errors.slug}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Cover image URL</Label>
          <Input
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tags</Label>
          <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5">
            {tags.map((t, i) => (
              <Badge key={`${t}-${i}`} variant="secondary" className="gap-1">
                {t}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${t}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={onTagKey}
              placeholder={tags.length ? "" : "rag, embeddings…"}
              className="flex-1 min-w-[8rem] bg-transparent px-1 py-0.5 text-sm outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-border bg-card shadow-soft">
          <div className="border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Markdown
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`# Heading\n\nWrite in **markdown**.`}
            className="min-h-[520px] flex-1 rounded-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0"
          />
          {errors.content && (
            <p className="px-4 pb-2 text-xs text-destructive">
              {errors.content}
            </p>
          )}
        </div>
        <div className="flex flex-col rounded-2xl border border-border bg-card shadow-soft">
          <div className="border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Preview
          </div>
          <div
            className="prose prose-sm max-w-none flex-1 space-y-3 overflow-y-auto p-5 text-sm text-foreground/90"
            dangerouslySetInnerHTML={{ __html: previewHtml || "<p class='text-muted-foreground'>Start writing to see a preview.</p>" }}
          />
        </div>
      </div>
    </div>
  );
}
