import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Upload, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { useAuth } from "@/lib/auth";
import {
  createProject,
  slugify,
  type CreateProjectInput,
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
  title: z.string().trim().min(2, "Title is required").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and dashes"),
  shortDescription: z.string().trim().min(1, "Short description is required").max(240),
  problem: z.string().max(2000).optional(),
  solution: z.string().max(2000).optional(),
  architecture: z.string().max(2000).optional(),
  results: z.string().max(2000).optional(),
  technologies: z.array(z.string()).min(1, "Add at least one technology"),
  githubUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  liveDemoUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  category: z.string().min(1, "Select a category"),
  tags: z.array(z.string()),
  featured: z.boolean(),
});

type FieldErrors = Partial<Record<keyof CreateProjectInput, string>>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const emptyState = {
  title: "",
  slug: "",
  slugTouched: false,
  shortDescription: "",
  problem: "",
  solution: "",
  architecture: "",
  results: "",
  technologies: [] as string[],
  githubUrl: "",
  liveDemoUrl: "",
  category: "",
  tags: [] as string[],
  featured: false,
  screenshots: [] as { name: string; url: string }[],
};

export function AddProjectDialog({ open, onOpenChange }: Props) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyState);
  const [techInput, setTechInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(emptyState);
      setTechInput("");
      setTagInput("");
      setErrors({});
    }
  }, [open]);

  const autoSlug = useMemo(() => slugify(form.title), [form.title]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onTitleChange(v: string) {
    setForm((f) => ({
      ...f,
      title: v,
      slug: f.slugTouched ? f.slug : slugify(v),
    }));
  }

  function addFromInput(kind: "tech" | "tag") {
    const raw = kind === "tech" ? techInput : tagInput;
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    if (kind === "tech") {
      update("technologies", Array.from(new Set([...form.technologies, ...parts])));
      setTechInput("");
    } else {
      update("tags", Array.from(new Set([...form.tags, ...parts])));
      setTagInput("");
    }
  }

  function onChipKey(e: KeyboardEvent<HTMLInputElement>, kind: "tech" | "tag") {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addFromInput(kind);
    } else if (e.key === "Backspace") {
      const val = kind === "tech" ? techInput : tagInput;
      if (val === "") {
        if (kind === "tech" && form.technologies.length) {
          update("technologies", form.technologies.slice(0, -1));
        } else if (kind === "tag" && form.tags.length) {
          update("tags", form.tags.slice(0, -1));
        }
      }
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    if (!next.length) return;
    setForm((f) => ({ ...f, screenshots: [...f.screenshots, ...next] }));
  }

  const mutation = useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(token, input),
    onSuccess: () => {
      toast.success("Project created");
      qc.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
    },
    onError: (err: { message?: string; fields?: Record<string, string> }) => {
      if (err?.fields) setErrors(err.fields as FieldErrors);
      toast.error(err?.message ?? "Could not create project");
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof CreateProjectInput;
        if (key && !fe[key]) fe[key] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});
    mutation.mutate({
      ...parsed.data,
      screenshots: form.screenshots.map((s) => s.url),
    } as CreateProjectInput);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add project</DialogTitle>
          <DialogDescription>
            Showcase a case study on your portfolio. You can always edit it later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" error={errors.title}>
              <Input
                value={form.title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Realtime vector search engine"
              />
            </Field>
            <Field label="Slug" error={errors.slug}>
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value, slugTouched: true }))
                }
                placeholder={autoSlug || "my-project"}
              />
            </Field>
          </div>

          <Field label="Short description" error={errors.shortDescription}>
            <Textarea
              rows={2}
              value={form.shortDescription}
              onChange={(e) => update("shortDescription", e.target.value)}
              placeholder="One-liner that appears on your portfolio card."
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Problem">
              <Textarea
                rows={3}
                value={form.problem}
                onChange={(e) => update("problem", e.target.value)}
              />
            </Field>
            <Field label="Solution">
              <Textarea
                rows={3}
                value={form.solution}
                onChange={(e) => update("solution", e.target.value)}
              />
            </Field>
            <Field label="Architecture summary">
              <Textarea
                rows={3}
                value={form.architecture}
                onChange={(e) => update("architecture", e.target.value)}
              />
            </Field>
            <Field label="Results">
              <Textarea
                rows={3}
                value={form.results}
                onChange={(e) => update("results", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Technologies" error={errors.technologies}>
            <ChipInput
              values={form.technologies}
              onRemove={(i) =>
                update(
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
            <Field label="GitHub URL" error={errors.githubUrl}>
              <Input
                value={form.githubUrl}
                onChange={(e) => update("githubUrl", e.target.value)}
                placeholder="https://github.com/you/repo"
              />
            </Field>
            <Field label="Live demo URL" error={errors.liveDemoUrl}>
              <Input
                value={form.liveDemoUrl}
                onChange={(e) => update("liveDemoUrl", e.target.value)}
                placeholder="https://demo.example.com"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" error={errors.category}>
              <Select
                value={form.category}
                onValueChange={(v) => update("category", v)}
              >
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
                  update(
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
                Highlight this project at the top of your portfolio.
              </p>
            </div>
            <Switch
              checked={form.featured}
              onCheckedChange={(v) => update("featured", v)}
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
                        update(
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

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
