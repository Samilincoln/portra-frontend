import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, Edit, Loader2, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AIDraftBox } from "@/components/dashboard/AIDraftBox";

import { useAuth } from "@/lib/auth";
import { slugify } from "@/lib/projects";
import {
  createBlog,
  deleteBlog,
  generateBlogDraft,
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

  // New posts always start in the editor; existing posts open in read-only
  // view first, matching the project detail page's view/edit pattern.
  const [isEditing, setIsEditing] = useState(!existing);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(existing?.slug));
  const [coverImageUrl, setCoverImageUrl] = useState(
    existing?.coverImage ?? existing?.cover_image ?? "",
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
      existing ? updateBlog(token, existing.id, input) : createBlog(token, input),
    onSuccess: (data) => {
      toast.success(existing ? "Post updated" : "Post created");
      qc.invalidateQueries({ queryKey: ["blogs"] });
      if (existing) qc.setQueryData(["blogs", existing.id], data);
      if (!existing) {
        navigate({ to: "/dashboard/blog/$id/edit", params: { id: data.id } });
      } else {
        setIsEditing(false);
      }
    },
    onError: (err: { message?: string }) => toast.error(err?.message ?? "Could not save"),
  });

  const publishMutation = useMutation({
    mutationFn: (nextPublished: boolean) =>
      updateBlog(token, existing!.id, {
        status: nextPublished ? "published" : "draft",
      }),
    onSuccess: (data, nextPublished) => {
      toast.success(nextPublished ? "Post published" : "Moved to draft");
      qc.setQueryData(["blogs", existing!.id], data);
      qc.invalidateQueries({ queryKey: ["blogs"] });
    },
    onError: (err: { message?: string }) => toast.error(err?.message ?? "Could not update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBlog(token, existing!.id),
    onSuccess: () => {
      toast.success("Post deleted");
      qc.invalidateQueries({ queryKey: ["blogs"] });
      navigate({ to: "/dashboard/blog" });
    },
    onError: (err: { message?: string }) => toast.error(err?.message ?? "Could not delete"),
  });

  const draftMutation = useMutation({
    mutationFn: (prompt: string) =>
      generateBlogDraft(token, {
        prompt,
        title: title || undefined,
        existingContent: content || undefined,
        id: existing?.id,
      }),
    onSuccess: (data) => {
      if (data.title) setTitle(data.title);
      if (data.content) setContent(data.content);
      if (data.tags?.length) setTags(Array.from(new Set([...tags, ...data.tags])));
      toast.success("AI draft ready — review before publishing");
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not generate a draft"),
  });

  function handleTogglePublish(v: boolean) {
    setPublished(v);
    if (existing) publishMutation.mutate(v);
  }

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

  function cancelEdit() {
    if (!existing) return;
    // Reset the form back to the saved post and drop out of edit mode.
    setTitle(existing.title ?? "");
    setSlug(existing.slug ?? "");
    setSlugTouched(Boolean(existing.slug));
    setCoverImageUrl(existing.coverImage ?? existing.cover_image ?? "");
    setTags(existing.tags ?? []);
    setContent(existing.content ?? "");
    setPublished(existing.status === "published");
    setErrors({});
    setIsEditing(false);
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
            {existing ? title || "Untitled post" : "New post"}
          </h1>
          {existing && (
            <p className="mt-1 text-sm text-muted-foreground">
              {isEditing ? "Edit your post." : "View post details. Click Edit to make changes."}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-soft">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {published ? "Published" : "Draft"}
            </span>
            <Switch
              checked={published}
              onCheckedChange={handleTogglePublish}
              disabled={publishMutation.isPending}
            />
          </div>

          {existing && !isEditing && (
            <>
              <Button
                type="button"
                variant="outline"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button type="button" onClick={() => setIsEditing(true)} className="gap-1.5">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </>
          )}

          {existing && isEditing && (
            <Button type="button" variant="outline" onClick={cancelEdit} className="gap-1.5">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          )}

          {isEditing && (
            <>
              <Button variant="outline" onClick={() => save("draft")} disabled={mutation.isPending}>
                Save draft
              </Button>
              <Button onClick={() => save("published")} disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Publishing…
                  </>
                ) : (
                  "Publish"
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-6">
          <AIDraftBox
            label="Draft this post with AI"
            placeholder="e.g. Write a technical deep-dive on the caching layer, aimed at backend engineers…"
            isGenerating={draftMutation.isPending}
            onGenerate={(prompt) => draftMutation.mutate(prompt)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="How I built a realtime vector index in Rust"
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
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
              {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
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
                <p className="px-4 pb-2 text-xs text-destructive">{errors.content}</p>
              )}
            </div>
            <div className="flex flex-col rounded-2xl border border-border bg-card shadow-soft">
              <div className="border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Preview
              </div>
              <div
                className="prose prose-sm max-w-none flex-1 space-y-3 overflow-y-auto p-5 text-sm text-foreground/90"
                dangerouslySetInnerHTML={{
                  __html:
                    previewHtml ||
                    "<p class='text-muted-foreground'>Start writing to see a preview.</p>",
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
          {coverImageUrl && (
            <div className="aspect-[3/1] w-full overflow-hidden rounded-xl border border-border bg-muted">
              <img src={coverImageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Slug</Label>
              <p className="font-mono text-base text-muted-foreground">/{slug || "—"}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Tags</Label>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <Badge key={t} variant="secondary" className="font-normal">
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-base text-muted-foreground">—</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Content</Label>
            <div
              className="prose prose-sm max-w-none space-y-3 rounded-xl border border-border bg-background/50 p-5 text-sm text-foreground/90"
              dangerouslySetInnerHTML={{
                __html: previewHtml || "<p class='text-muted-foreground'>Nothing written yet.</p>",
              }}
            />
          </div>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the post from your blog and can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
