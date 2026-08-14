import React, { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import {
  createFileRoute,
  useNavigate,
  useRouter,
  Link,
} from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import {
  ArrowLeft,
  Sparkles,
  Trash2,
  ExternalLink,
  Github,
  X,
  Loader2,
  Edit,
  Eye,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";

import { useAuth } from "@/lib/auth";
import {
  deleteProject,
  generateProjectSummary,
  generateFromGithub,
  getProject,
  slugify,
  updateProject,
  type CreateProjectInput,
  type Project,
} from "@/lib/projects";

const CATEGORIES = [
  "AI / ML",
  "Backend",
  "Data",
  "Infrastructure",
  "Web",
  "Mobile",
  "Other",
];

const schema = z.object({
  title: z.string().trim().min(2, "Title is required").max(200),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and dashes"),
  shortDescription: z.string().trim().min(1, "Short description is required").max(500),
  category: z.string().min(1, "Select a category"),
  technologies: z.array(z.string()).min(1, "Add at least one technology"),
});

export const Route = createFileRoute("/dashboard/projects/$id")({
  head: () => ({ meta: [{ title: "Project — Portra" }] }),
  component: ProjectDetailPage,
});

type FormState = {
  title: string;
  slug: string;
  slugTouched: boolean;
  shortDescription: string;
  problem: string;
  solution: string;
  architecture: string;
  results: string;
  technologies: string[];
  githubUrl: string;
  liveDemoUrl: string;
  category: string;
  tags: string[];
  featured: boolean;
  published: boolean;
  screenshots: { name: string; url: string }[];
};

function toForm(p: Project): FormState {
  return {
    title: p?.title ?? "",
    slug: p?.slug ?? "",
    slugTouched: true,
    shortDescription: p?.shortDescription ?? "",
    problem: p?.problem ?? "",
    solution: p?.solution ?? "",
    architecture: p?.architecture ?? "",
    results: p?.results ?? "",
    technologies: Array.isArray(p?.technologies) ? p.technologies : [],
    githubUrl: p?.githubUrl ?? "",
    liveDemoUrl: p?.liveDemoUrl ?? "",
    category: p?.category ?? "",
    tags: Array.isArray(p?.tags) ? p.tags : [],
    featured: Boolean(p?.featured),
    published: p?.status === "published" || Boolean(p?.published),
    screenshots: Array.isArray(p?.screenshots)
      ? p.screenshots.map((s, i) => ({
          name: `screenshot-${i}`,
          url: String(s),
        }))
      : [],
  };
}

function ProjectDetailPage() {
  const { id } = Route.useParams();
  useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();

  const query = useQuery({
    queryKey: ["projects", id],
    queryFn: () => getProject(id),
    enabled: Boolean(id),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [techInput, setTechInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (query.data && !form) setForm(toForm(query.data));
  }, [query.data, form]);

  const autoSlug = useMemo(() => (form ? slugify(form.title) : ""), [form]);

  function upd<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  const saveMutation = useMutation({
    mutationFn: (input: Partial<CreateProjectInput> & { published?: boolean }) =>
      updateProject(id, input),
    onSuccess: (data) => {
      toast.success("Project saved");
      qc.setQueryData(["projects", id], data);
      qc.invalidateQueries({ queryKey: ["projects"] });
      setForm(toForm(data));
      setIsEditing(false);
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not save"),
  });

  const publishMutation = useMutation({
    mutationFn: (published: boolean) =>
      updateProject(id, { published }),
    onSuccess: (data, published) => {
      toast.success(published ? "Project published" : "Moved to draft");
      qc.setQueryData(["projects", id], data);
      qc.invalidateQueries({ queryKey: ["projects"] });
      setForm(toForm(data));
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not update status"),
  });

  const summaryMutation = useMutation({
    mutationFn: () => generateProjectSummary(id),
    onSuccess: (data) => {
      setForm((f) =>
        f
          ? {
              ...f,
              shortDescription: data.shortDescription ?? f.shortDescription,
              architecture: data.architecture ?? f.architecture,
              solution: data.solution ?? f.solution,
              problem: data.problem ?? f.problem,
              results: data.results ?? f.results,
            }
          : f,
      );
      toast.success("AI summary drafted — review before saving");
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not generate summary"),
  });

  const githubSummaryMutation = useMutation({
    mutationFn: (githubUrl: string) => generateFromGithub(githubUrl, id),
    onSuccess: (data, githubUrl) => {
      setForm((f) => {
        if (!f) return f;
        const aiTechs = Array.isArray(data.technologies) ? data.technologies : [];
        const mergedTechs = Array.from(new Set([...f.technologies, ...aiTechs]));
        const aiTags = Array.isArray(data.tags) ? data.tags : [];
        const mergedTags = Array.from(new Set([...f.tags, ...aiTags]));
        return {
          ...f,
          title: data.title ?? f.title,
          slug: f.slugTouched ? f.slug : slugify(data.title ?? f.title),
          slugTouched: data.title ? false : f.slugTouched,
          githubUrl: githubUrl,
          shortDescription: data.description ?? f.shortDescription,
          problem: data.problem ?? f.problem,
          solution: data.solution ?? f.solution,
          results: data.results ?? f.results,
          architecture: data.architecture ?? f.architecture,
          technologies: mergedTechs,
          tags: mergedTags,
        };
      });
      toast.success("Project details generated from GitHub — review before saving");
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not generate from GitHub"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(id),
    onSuccess: () => {
      toast.success("Project deleted");
      qc.invalidateQueries({ queryKey: ["projects"] });
      navigate({ to: "/dashboard/projects" });
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not delete"),
  });

  function handleTogglePublish(v: boolean) {
    upd("published", v);
    publishMutation.mutate(v);
  }

  function addChip(kind: "tech" | "tag") {
    if (!form) return;
    const raw = kind === "tech" ? techInput : tagInput;
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    if (kind === "tech") {
      upd(
        "technologies",
        Array.from(new Set([...form.technologies, ...parts])),
      );
      setTechInput("");
    } else {
      upd("tags", Array.from(new Set([...form.tags, ...parts])));
      setTagInput("");
    }
  }

  function onChipKey(e: KeyboardEvent<HTMLInputElement>, kind: "tech" | "tag") {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip(kind);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    if (!next.length) return;
    setForm((f) => (f ? { ...f, screenshots: [...f.screenshots, ...next] } : f));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const payload = {
      title: form.title,
      slug: form.slug || autoSlug,
      shortDescription: form.shortDescription,
      problem: form.problem,
      solution: form.solution,
      architecture: form.architecture,
      results: form.results,
      technologies: form.technologies,
      githubUrl: form.githubUrl,
      liveDemoUrl: form.liveDemoUrl,
      category: form.category,
      tags: form.tags,
      featured: form.featured,
    };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as string;
        if (k && !fe[k]) fe[k] = issue.message;
      }
      setErrors(fe);
      toast.error("Fix the highlighted fields before saving");
      return;
    }
    setErrors({});
    saveMutation.mutate({
      ...payload,
      screenshots: form.screenshots.map((s) => s.url),
    } as CreateProjectInput);
  }

  if (!id) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">Invalid project ID.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate({ to: "/dashboard/projects" })}
        >
          Back to projects
        </Button>
      </div>
    );
  }

  if (query.isLoading || !form) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <Skeleton className="h-[600px] w-full rounded-2xl" />
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">Couldn't load this project.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.invalidate()}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            to="/dashboard/projects"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {form.title || "Untitled project"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEditing ? "Edit your project details." : "View project details. Click Edit to make changes."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2 shadow-soft">
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {form.published ? "Published" : "Draft"}
              </p>
              <p className="text-xs text-muted-foreground">
                {form.published ? "Visible on portfolio" : "Only visible to you"}
              </p>
            </div>
            <Switch
              checked={form.published}
              onCheckedChange={handleTogglePublish}
              disabled={publishMutation.isPending}
            />
          </div>
          {!isEditing ? (
            <Button
              variant="default"
              onClick={() => setIsEditing(true)}
              className="gap-1.5"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="gap-1.5"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        {isEditing ? (
          <>
            <form
              onSubmit={onSubmit}
              className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-soft"
            >
              <h2 className="text-lg font-semibold">Project details</h2>

              <GitHubSummaryCard
                githubUrl={form.githubUrl}
                isPending={githubSummaryMutation.isPending}
                onGenerate={(url) => githubSummaryMutation.mutate(url)}
                onUrlChange={(url) => upd("githubUrl", url)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title" error={errors.title}>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) =>
                        f
                          ? {
                              ...f,
                              title: e.target.value,
                              slug: f.slugTouched ? f.slug : slugify(e.target.value),
                            }
                          : f,
                      )
                    }
                  />
                </Field>
                <Field label="Slug" error={errors.slug}>
                  <Input
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) =>
                        f ? { ...f, slug: e.target.value, slugTouched: true } : f,
                      )
                    }
                    placeholder={autoSlug}
                  />
                </Field>
              </div>

              <Field label="Short description" error={errors.shortDescription}>
                <Textarea
                  rows={2}
                  value={form.shortDescription}
                  onChange={(e) => upd("shortDescription", e.target.value)}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Problem">
                  <Textarea
                    rows={3}
                    value={form.problem}
                    onChange={(e) => upd("problem", e.target.value)}
                  />
                </Field>
                <Field label="Solution">
                  <Textarea
                    rows={3}
                    value={form.solution}
                    onChange={(e) => upd("solution", e.target.value)}
                  />
                </Field>
                <Field label="Architecture summary">
                  <Textarea
                    rows={3}
                    value={form.architecture}
                    onChange={(e) => upd("architecture", e.target.value)}
                  />
                </Field>
                <Field label="Results">
                  <Textarea
                    rows={3}
                    value={form.results}
                    onChange={(e) => upd("results", e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Technologies" error={errors.technologies}>
                <ChipInput
                  values={form.technologies}
                  onRemove={(i) =>
                    upd(
                      "technologies",
                      form.technologies.filter((_, idx) => idx !== i),
                    )
                  }
                  input={techInput}
                  setInput={setTechInput}
                  onKeyDown={(e) => onChipKey(e, "tech")}
                  placeholder="Python, PyTorch, FastAPI…"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="GitHub URL">
                  <Input
                    value={form.githubUrl}
                    onChange={(e) => upd("githubUrl", e.target.value)}
                  />
                </Field>
                <Field label="Live demo URL">
                  <Input
                    value={form.liveDemoUrl}
                    onChange={(e) => upd("liveDemoUrl", e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category" error={errors.category}>
                  <Select value={form.category} onValueChange={(v) => upd("category", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Tags">
                  <ChipInput
                    values={form.tags}
                    onRemove={(i) =>
                      upd(
                        "tags",
                        form.tags.filter((_, idx) => idx !== i),
                      )
                    }
                    input={tagInput}
                    setInput={setTagInput}
                    onKeyDown={(e) => onChipKey(e, "tag")}
                    placeholder="rag, embeddings…"
                  />
                </Field>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Featured project</p>
                  <p className="text-xs text-muted-foreground">
                    Pin to the top of your portfolio.
                  </p>
                </div>
                <Switch
                  checked={form.featured}
                  onCheckedChange={(v) => upd("featured", v)}
                />
              </div>

              <Field label="Screenshots">
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    handleFiles(e.dataTransfer.files);
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/30 px-6 py-8 text-center transition-colors",
                    dragActive && "border-primary bg-primary/5",
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop screenshots here or click to upload</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to a few MB each.</p>
                </label>
                {form.screenshots.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {form.screenshots.map((s, idx) => (
                      <div
                        key={s.url}
                        className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-muted"
                      >
                        <img
                          src={s.url}
                          alt={s.name}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            upd(
                              "screenshots",
                              form.screenshots.filter((_, i) => i !== idx),
                            )
                          }
                          className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Remove screenshot"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete project
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>

            <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Live preview
              </p>
              <PreviewCard form={form} />
            </aside>
          </>
        ) : (
          <>
            <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Project details</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-1.5"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>

              <div className="space-y-4">
                <Field label="Title">
                  <p className="text-base font-medium">{form.title || "—"}</p>
                </Field>
                <Field label="Slug">
                  <p className="text-base text-muted-foreground font-mono">
                    {form.slug || "—"}
                  </p>
                </Field>
                <Field label="Short description">
                  <p className="text-base text-muted-foreground">
                    {form.shortDescription || "—"}
                  </p>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Problem">
                    <p className="text-base text-muted-foreground whitespace-pre-wrap">
                      {form.problem || "—"}
                    </p>
                  </Field>
                  <Field label="Solution">
                    <p className="text-base text-muted-foreground whitespace-pre-wrap">
                      {form.solution || "—"}
                    </p>
                  </Field>
                  <Field label="Architecture summary">
                    <p className="text-base text-muted-foreground whitespace-pre-wrap">
                      {form.architecture || "—"}
                    </p>
                  </Field>
                  <Field label="Results">
                    <p className="text-base text-muted-foreground whitespace-pre-wrap">
                      {form.results || "—"}
                    </p>
                  </Field>
                </div>

                <Field label="Technologies">
                  {form.technologies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {form.technologies.map((t, i) => (
                        <Badge key={`${t}-${i}`} variant="secondary" className="font-normal">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-base text-muted-foreground">—</p>
                  )}
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="GitHub URL">
                    {form.githubUrl ? (
                      <a
                        href={form.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-base text-accent hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View
                      </a>
                    ) : (
                      <p className="text-base text-muted-foreground">—</p>
                    )}
                  </Field>
                  <Field label="Live demo URL">
                    {form.liveDemoUrl ? (
                      <a
                        href={form.liveDemoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-base text-accent hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View
                      </a>
                    ) : (
                      <p className="text-base text-muted-foreground">—</p>
                    )}
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Category">
                    <p className="text-base text-muted-foreground">
                      {form.category || "—"}
                    </p>
                  </Field>
                  <Field label="Tags">
                    {form.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {form.tags.map((t) => (
                          <Badge key={t} variant="secondary" className="font-normal">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-base text-muted-foreground">—</p>
                    )}
                  </Field>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Featured project</p>
                    <p className="text-xs text-muted-foreground">
                      {form.featured ? "Pinned at the top of your portfolio." : "Not pinned."}
                    </p>
                  </div>
                  <Switch
                    checked={form.featured}
                    disabled
                  />
                </div>

                <Field label="Screenshots">
                  {form.screenshots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {form.screenshots.map((s, idx) => (
                        <div
                          key={s.url}
                          className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-muted"
                        >
                          <img
                            src={s.url}
                            alt={s.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-base text-muted-foreground">No screenshots uploaded.</p>
                  )}
                </Field>
              </div>
            </div>

            <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Preview
              </p>
              <PreviewCard form={form} />
            </aside>
          </>
        )}
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the project from your portfolio and can't be undone.
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

function PreviewCard({ form }: { form: FormState }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="aspect-video bg-gradient-to-br from-primary/15 via-secondary to-background" />
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {form.category || "Uncategorized"}
            </p>
            <h3 className="mt-1 text-lg font-semibold leading-tight">
              {form.title || "Untitled project"}
            </h3>
          </div>
          {form.featured ? (
            <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300">
              Featured
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {form.shortDescription || "Add a short description to summarize this project."}
        </p>
        {form.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {form.technologies.slice(0, 8).map((t, i) => (
              <Badge key={`${t}-${i}`} variant="secondary" className="font-normal">
                {t}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {form.liveDemoUrl && (
            <Badge variant="outline" className="gap-1 font-normal">
              <ExternalLink className="h-3 w-3" /> Live demo
            </Badge>
          )}
          {form.githubUrl && (
            <Badge variant="outline" className="gap-1 font-normal">
              <Github className="h-3 w-3" /> Code
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function ChipInput({
  values,
  onRemove,
  input,
  setInput,
  onKeyDown,
  placeholder,
}: {
  values: string[];
  onRemove: (index: number) => void;
  input: string;
  setInput: (v: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 focus-within:border-ring">
      {values.map((v, i) => (
        <Badge key={`${v}-${i}`} variant="secondary" className="gap-1">
          {v}
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="text-muted-foreground hover:text-foreground"
            aria-label={`Remove ${v}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={values.length ? "" : placeholder}
        className="flex-1 min-w-[8rem] bg-transparent px-1 py-0.5 text-sm outline-none"
      />
    </div>
  );
}

function GitHubSummaryCard({
  githubUrl,
  isPending,
  onGenerate,
  onUrlChange,
}: {
  githubUrl: string;
  isPending: boolean;
  onGenerate: (url: string) => void;
  onUrlChange: (url: string) => void;
}) {
  const [url, setUrl] = useState(githubUrl);

  useEffect(() => {
    setUrl(githubUrl);
  }, [githubUrl]);

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Github className="h-4 w-4" />
          Generate from GitHub
        </CardTitle>
        <CardDescription>
          Paste a GitHub repository URL to auto-fill project details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              onUrlChange(e.target.value);
            }}
            placeholder="https://github.com/user/repo"
            className="flex-1"
          />
          <Button
            type="button"
            variant="default"
            disabled={!url.trim() || isPending}
            onClick={() => onGenerate(url.trim())}
            className="gap-1.5 shrink-0"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}