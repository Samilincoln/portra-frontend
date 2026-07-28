import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Plus, Pencil, Trash2, Briefcase, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

import { AIDraftBox } from "@/components/dashboard/AIDraftBox";

import { useAuth } from "@/lib/auth";
import {
  createExperience,
  deleteExperience,
  generateExperienceDescription,
  listExperiences,
  updateExperience,
  type Experience,
  type ExperienceInput,
} from "@/lib/experiences";
import {
  createSkill,
  deleteSkill,
  listSkills,
  SKILL_LEVELS,
  type Skill,
  type SkillLevel,
} from "@/lib/skills";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/experience")({
  head: () => ({ meta: [{ title: "Experience & Skills — Portra" }] }),
  component: ExperiencePage,
});

const DEFAULT_SKILL_CATEGORIES = [
  "Languages",
  "AI / ML",
  "Backend",
  "DevOps",
  "Data",
  "Frontend",
  "Other",
];

function ExperiencePage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Experience & Skills</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Curate your career timeline and highlight the tools you specialize in.
        </p>
      </div>

      <ExperienceSection />
      <SkillsSection />
    </div>
  );
}

/* -------------------- Experience -------------------- */

const expSchema = z.object({
  company: z.string().trim().min(1, "Company is required"),
  role: z.string().trim().min(1, "Role is required"),
  startDate: z.string().trim().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
});

type ExpForm = {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  present: boolean;
  description: string;
  location: string;
};

const emptyExp: ExpForm = {
  company: "",
  role: "",
  startDate: "",
  endDate: "",
  present: true,
  description: "",
  location: "",
};

function ExperienceSection() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Experience | null>(null);

  const query = useQuery({
    queryKey: ["experiences"],
    queryFn: () => listExperiences(token),
  });

  const sorted = useMemo(() => {
    return [...(query.data ?? [])].sort((a, b) => {
      const ae = a.endDate ?? "9999-99";
      const be = b.endDate ?? "9999-99";
      if (ae !== be) return be.localeCompare(ae);
      return (b.startDate ?? "").localeCompare(a.startDate ?? "");
    });
  }, [query.data]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExperience(token, id),
    onSuccess: () => {
      toast.success("Experience removed");
      qc.invalidateQueries({ queryKey: ["experiences"] });
      setConfirmDelete(null);
    },
    onError: (err: { message?: string }) => toast.error(err?.message ?? "Could not delete"),
  });

  function openAdd() {
    setEditing(null);
    setPanelOpen(true);
  }

  function openEdit(exp: Experience) {
    setEditing(exp);
    setPanelOpen(true);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Work experience</h2>
          <p className="text-sm text-muted-foreground">
            Tell your story in reverse chronological order.
          </p>
        </div>
        <Button onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add experience
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        {query.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : query.isError ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Couldn't load experiences.
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
              <Briefcase className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">No experience added yet</p>
            <p className="text-sm text-muted-foreground">
              Add your roles to build a compelling career timeline.
            </p>
            <Button onClick={openAdd} size="sm" className="mt-2 gap-1.5">
              <Plus className="h-4 w-4" />
              Add experience
            </Button>
          </div>
        ) : (
          <Timeline items={sorted} onEdit={openEdit} onDelete={(exp) => setConfirmDelete(exp)} />
        )}
      </div>

      <ExperiencePanel open={panelOpen} onOpenChange={setPanelOpen} editing={editing} />

      <AlertDialog open={Boolean(confirmDelete)} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this experience?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete
                ? `${confirmDelete.role} at ${confirmDelete.company} will be removed from your timeline.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function formatMonth(iso?: string | null) {
  if (!iso) return "";
  const [y, m] = iso.split("-");
  if (!y) return iso;
  const date = new Date(Number(y), (Number(m) || 1) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function Timeline({
  items,
  onEdit,
  onDelete,
}: {
  items: Experience[];
  onEdit: (e: Experience) => void;
  onDelete: (e: Experience) => void;
}) {
  return (
    <ol className="relative space-y-6 pl-6">
      <span aria-hidden className="absolute left-2 top-1 bottom-1 w-px bg-border" />
      {items.map((exp) => (
        <li key={exp.id} className="relative">
          <span
            aria-hidden
            className="absolute -left-[19px] top-2 h-3 w-3 rounded-full border-2 border-background bg-primary shadow"
          />
          <div className="group flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/60 p-4 transition-colors hover:border-border">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{exp.role}</p>
                <span className="text-muted-foreground">·</span>
                <p className="text-sm text-muted-foreground">{exp.company}</p>
              </div>
              <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                {formatMonth(exp.startDate)} — {exp.endDate ? formatMonth(exp.endDate) : "Present"}
                {exp.location ? ` · ${exp.location}` : ""}
              </p>
              {exp.description ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">
                  {exp.description}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button variant="ghost" size="icon" onClick={() => onEdit(exp)} aria-label="Edit">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(exp)}
                aria-label="Delete"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ExperiencePanel({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Experience | null;
}) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState<ExpForm>(emptyExp);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        company: editing.company,
        role: editing.role,
        startDate: editing.startDate,
        endDate: editing.endDate ?? "",
        present: !editing.endDate,
        description: editing.description ?? "",
        location: editing.location ?? "",
      });
    } else {
      setForm(emptyExp);
    }
    setErrors({});
  }, [open, editing]);

  const mutation = useMutation({
    mutationFn: (input: ExperienceInput) =>
      editing ? updateExperience(token, editing.id, input) : createExperience(token, input),
    onSuccess: () => {
      toast.success(editing ? "Experience updated" : "Experience added");
      qc.invalidateQueries({ queryKey: ["experiences"] });
      onOpenChange(false);
    },
    onError: (err: { message?: string }) => toast.error(err?.message ?? "Could not save"),
  });

  const draftMutation = useMutation({
    mutationFn: (prompt: string) =>
      generateExperienceDescription(token, {
        prompt,
        role: form.role || undefined,
        company: form.company || undefined,
        startDate: form.startDate || undefined,
        endDate: form.present ? null : form.endDate || undefined,
      }),
    onSuccess: (data) => {
      if (data.description) {
        setForm((f) => ({ ...f, description: data.description! }));
        toast.success("AI draft ready — review before saving");
      }
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not generate a description"),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: ExperienceInput = {
      company: form.company,
      role: form.role,
      startDate: form.startDate,
      endDate: form.present ? null : form.endDate || null,
      description: form.description || null,
      location: form.location || null,
    };
    const parsed = expSchema.safeParse(payload);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as string;
        if (k && !fe[k]) fe[k] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});
    mutation.mutate(payload);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit experience" : "Add experience"}</SheetTitle>
          <SheetDescription>
            {editing
              ? "Refine your role details."
              : "Share a role you've held and what you shipped."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label="Role" error={errors.role}>
              <Input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Senior ML Engineer"
              />
            </FieldRow>
            <FieldRow label="Company" error={errors.company}>
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Anthropic"
              />
            </FieldRow>
          </div>

          <FieldRow label="Location">
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Remote · San Francisco"
            />
          </FieldRow>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label="Start date" error={errors.startDate}>
              <Input
                type="month"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </FieldRow>
            <FieldRow label="End date">
              <Input
                type="month"
                value={form.endDate}
                disabled={form.present}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </FieldRow>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium">I currently work here</p>
              <p className="text-xs text-muted-foreground">
                Ends the timeline entry with "Present".
              </p>
            </div>
            <Switch
              checked={form.present}
              onCheckedChange={(v) =>
                setForm((f) => ({
                  ...f,
                  present: v,
                  endDate: v ? "" : f.endDate,
                }))
              }
            />
          </div>

          <AIDraftBox
            label="Draft description with AI"
            placeholder="e.g. Focus on the migration to microservices and the team I led…"
            isGenerating={draftMutation.isPending}
            onGenerate={(prompt) => draftMutation.mutate(prompt)}
          />

          <FieldRow label="Description">
            <Textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What you owned, what you shipped, what changed because of it."
            />
          </FieldRow>
        </form>

        <SheetFooter className="mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : editing ? "Save changes" : "Add experience"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function FieldRow({
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

/* -------------------- Skills -------------------- */

const LEVEL_STYLE: Record<SkillLevel, string> = {
  Beginner: "bg-muted text-muted-foreground",
  Intermediate: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  Advanced: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  Expert: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

function SkillsSection() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(DEFAULT_SKILL_CATEGORIES[0]);
  const [level, setLevel] = useState<SkillLevel>("Advanced");
  const [customCategory, setCustomCategory] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const query = useQuery({
    queryKey: ["skills"],
    queryFn: () => listSkills(token),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Skill[]>();
    for (const s of query.data ?? []) {
      const key = s.category || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [query.data]);

  const addMutation = useMutation({
    mutationFn: () =>
      createSkill(token, {
        name: name.trim(),
        category: (useCustom ? customCategory.trim() : category) || "Other",
        level,
      }),
    onSuccess: () => {
      toast.success("Skill added");
      setName("");
      setCustomCategory("");
      setUseCustom(false);
      qc.invalidateQueries({ queryKey: ["skills"] });
    },
    onError: (err: { message?: string }) => toast.error(err?.message ?? "Could not add skill"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteSkill(token, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skills"] });
    },
    onError: (err: { message?: string }) => toast.error(err?.message ?? "Could not remove"),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Enter a skill name");
      return;
    }
    addMutation.mutate();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Skills</h2>
          <p className="text-sm text-muted-foreground">
            Group the tools you know by category and proficiency.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <form
          onSubmit={submit}
          className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_160px_auto]"
        >
          <Input
            placeholder="e.g. PyTorch"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {useCustom ? (
            <div className="flex gap-1.5">
              <Input
                placeholder="New category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setUseCustom(false)}
                aria-label="Use existing category"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Select
              value={category}
              onValueChange={(v) => {
                if (v === "__new__") setUseCustom(true);
                else setCategory(v);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_SKILL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
                <SelectItem value="__new__">+ New category…</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={level} onValueChange={(v) => setLevel(v as SkillLevel)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SKILL_LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={addMutation.isPending} className="gap-1.5">
            {addMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add
          </Button>
        </form>

        <div className="mt-6 space-y-6">
          {query.isLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : grouped.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No skills yet — add your first one above.
            </p>
          ) : (
            grouped.map(([cat, skills]) => (
              <div key={cat}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {cat}
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span
                      key={s.id}
                      className={cn(
                        "group inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-sm",
                      )}
                    >
                      <span className="font-medium">{s.name}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                          LEVEL_STYLE[s.level],
                        )}
                      >
                        {s.level}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMutation.mutate(s.id)}
                        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        aria-label={`Remove ${s.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
