import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import {
  Plus,
  Pencil,
  Trash2,
  Briefcase,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useAuth } from "@/lib/auth";
import {
  createExperience,
  deleteExperience,
  listExperiences,
  updateExperience,
  type Experience,
  type ExperienceInput,
} from "@/lib/experiences";
import {
  createSkill,
  deleteSkill,
  listSkills,
  updateSkill,
  SKILL_LEVELS,
  SKILL_LEVEL_VALUES,
  type Skill,
  type SkillLevel,
} from "@/lib/skills";
import { cn } from "@/lib/utils";
import { getMe } from "@/lib/users";
import { getTier, isAtLimit, type TierId } from "@/lib/plans";
import { AlertCircle } from "lucide-react";
import { useActiveProfile } from "@/lib/active-profile";
import { NoProfileEmptyState } from "@/components/dashboard/NoProfileEmptyState";
import { generateExperienceDescription } from "@/lib/ai.functions";

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
  const { activeProfile, profiles } = useActiveProfile();

  if (!activeProfile || profiles.length === 0) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Experience & Skills
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Curate your career timeline and highlight the tools you specialize in.
          </p>
        </div>
        <NoProfileEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Experience & Skills
        </h1>
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
  workMode: string;
};

const emptyExp: ExpForm = {
  company: "",
  role: "",
  startDate: "",
  endDate: "",
  present: true,
  description: "",
  location: "",
  workMode: "",
};

function ExperienceSection() {
  const { token } = useAuth();
  const { activeProfile } = useActiveProfile();
  const qc = useQueryClient();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Experience | null>(null);

  const userQuery = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getMe(token),
  });

  const query = useQuery({
    queryKey: ["experiences", activeProfile?.id],
    queryFn: () => listExperiences(token, { profileId: activeProfile?.id }),
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
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not delete"),
  });

  const tierId = (userQuery.data?.subscriptionTier as TierId) ?? "free";
  const tier = getTier(tierId);
  const atLimit = isAtLimit(tierId, "experiences", sorted.length);

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
        <Button onClick={openAdd} disabled={atLimit} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add experience
        </Button>
      </div>

      {atLimit ? (
        <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-accent" />
          <p className="text-muted-foreground">
            You've reached the {tier.label} limit of {tier.experiences} experiences.{" "}
            <a
              href="https://portra.app/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:underline"
            >
              Upgrade to get more →
            </a>
          </p>
        </div>
      ) : null}

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
          <Timeline
            items={sorted}
            onEdit={openEdit}
            onDelete={(exp) => setConfirmDelete(exp)}
          />
        )}
      </div>

      <ExperiencePanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        editing={editing}
      />

      <AlertDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
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
              onClick={() =>
                confirmDelete && deleteMutation.mutate(confirmDelete.id)
              }
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
  const match = iso.match(/^(\d{4})-(\d{2})/);
  if (!match) return iso;
  const [, y, m] = match;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[Number(m) - 1]} ${y}`;
}

function toMonthInput(iso?: string | null): string {
  if (!iso) return "";
  const match = iso.match(/^(\d{4}-\d{2})/);
  return match ? match[1] : "";
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
      <span
        aria-hidden
        className="absolute left-2 top-1 bottom-1 w-px bg-border"
      />
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
                {formatMonth(exp.startDate)} —{" "}
                {exp.endDate ? formatMonth(exp.endDate) : "Present"}
                {exp.location ? ` · ${exp.location}` : ""}
              </p>
              {exp.description ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">
                  {exp.description}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(exp)}
                aria-label="Edit"
              >
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
  const { activeProfile } = useActiveProfile();
  const qc = useQueryClient();
  const [form, setForm] = useState<ExpForm>(emptyExp);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiOpen, setAiOpen] = useState(false);
  const [aiIndustry, setAiIndustry] = useState("");
  const [aiTechnologies, setAiTechnologies] = useState("");
  const [aiAchievements, setAiAchievements] = useState("");
  const [aiTone, setAiTone] = useState<"professional" | "casual" | "technical">("professional");
  const [aiKeywords, setAiKeywords] = useState<string[]>([]);

  const runAiAssist = useServerFn(generateExperienceDescription);
  const aiMutation = useMutation({
    mutationFn: () =>
      runAiAssist({
        data: {
          company: form.company,
          role: form.role,
          location: form.location || undefined,
          startDate: form.startDate || undefined,
          endDate: form.present ? undefined : form.endDate || undefined,
          isCurrent: form.present,
          industry: aiIndustry || undefined,
          technologies: aiTechnologies ? aiTechnologies.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
          achievements: aiAchievements || undefined,
          tone: aiTone,
          token,
        },
      }),
    onSuccess: (result) => {
      setForm({ ...form, description: result.description });
      setAiKeywords(result.keywords);
      setAiOpen(false);
      setAiIndustry("");
      setAiTechnologies("");
      setAiAchievements("");
      setAiTone("professional");
      toast.success("Description generated — review before saving");
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "AI assist failed"),
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const locParts = (editing.location ?? "").split(" · ");
      const modes = ["Remote", "On-site", "Hybrid"];
      const detectedMode = locParts.length > 1 && modes.includes(locParts[0]) ? locParts[0] : "";
      const detectedLocation = locParts.length > 1 && modes.includes(locParts[0]) ? locParts.slice(1).join(" · ") : editing.location ?? "";
      setForm({
        company: editing.company,
        role: editing.role,
        startDate: toMonthInput(editing.startDate),
        endDate: toMonthInput(editing.endDate),
        present: !editing.endDate,
        description: editing.description ?? "",
        location: detectedLocation,
        workMode: detectedMode,
      });
    } else {
      setForm(emptyExp);
    }
    setErrors({});
  }, [open, editing]);

  const mutation = useMutation({
    mutationFn: (input: ExperienceInput) =>
      editing
        ? updateExperience(token, editing.id, input)
        : createExperience(token, input, activeProfile?.id),
    onSuccess: () => {
      toast.success(editing ? "Experience updated" : "Experience added");
      qc.invalidateQueries({ queryKey: ["experiences"] });
      onOpenChange(false);
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not save"),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const combinedLocation = form.workMode && form.location
      ? `${form.workMode} · ${form.location}`
      : form.workMode || form.location || null;
    const payload: ExperienceInput = {
      company: form.company,
      role: form.role,
      startDate: form.startDate,
      endDate: form.present ? null : form.endDate || null,
      description: form.description || null,
      location: combinedLocation,
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

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label="Location">
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="San Francisco"
              />
            </FieldRow>
            <FieldRow label="Mode of work">
              <Select
                value={form.workMode}
                onValueChange={(v) => setForm({ ...form, workMode: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Remote">Remote</SelectItem>
                  <SelectItem value="On-site">On-site</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label="Start date" error={errors.startDate}>
              <Input
                type="month"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
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

          <FieldRow
            label="Description"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs border-amber-400/40 bg-amber-400/10 text-amber-600 hover:bg-amber-400/20 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                onClick={() => setAiOpen(true)}
                disabled={!form.role || !form.company}
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI assist
              </Button>
            }
          >
            <Textarea
              rows={5}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="What you owned, what you shipped, what changed because of it."
            />
          </FieldRow>

          {aiKeywords.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">AI Keywords</Label>
              <div className="flex flex-wrap gap-1.5">
                {aiKeywords.map((kw) => (
                  <Badge key={kw} variant="secondary" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}
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
            {mutation.isPending
              ? "Saving…"
              : editing
                ? "Save changes"
                : "Add experience"}
          </Button>
        </SheetFooter>
      </SheetContent>

      {/* AI Assist Dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              AI Description Assistant
            </DialogTitle>
            <DialogDescription>
              AI will generate a professional description with relevant keywords
              based on your role and accomplishments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Role:</span>{" "}
              <span className="font-medium">{form.role || "—"}</span>
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="text-muted-foreground">Company:</span>{" "}
              <span className="font-medium">{form.company || "—"}</span>
            </div>
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Input
                value={aiIndustry}
                onChange={(e) => setAiIndustry(e.target.value)}
                placeholder="Fintech, Healthcare, E-commerce…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Technologies <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                value={aiTechnologies}
                onChange={(e) => setAiTechnologies(e.target.value)}
                placeholder="React, Go, PostgreSQL (comma-separated)"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Key achievements</Label>
              <Textarea
                rows={3}
                value={aiAchievements}
                onChange={(e) => setAiAchievements(e.target.value)}
                placeholder="Reduced latency by 40%, led team of 3, designed idempotency keys system…"
              />
              <p className="text-xs text-muted-foreground">
                The more context, the better the output.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Tone</Label>
              <Select
                value={aiTone}
                onValueChange={(v) => setAiTone(v as typeof aiTone)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAiOpen(false)}
              disabled={aiMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => aiMutation.mutate()}
              disabled={aiMutation.isPending || !aiAchievements.trim()}
            >
              {aiMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}

function FieldRow({
  label,
  error,
  children,
  action,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        {action}
      </div>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

/* -------------------- Skills -------------------- */

const LEVEL_COLOR: Record<number, string> = {
  1: "bg-zinc-400",
  2: "bg-amber-400",
  3: "bg-amber-500",
  4: "bg-yellow-400",
  5: "bg-yellow-500",
};

function SkillLevelDots({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`${level}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-2 rounded-full ring-1 ring-black/10 dark:ring-white/20",
            i <= level ? (LEVEL_COLOR[level] ?? "bg-zinc-400") : "bg-muted",
          )}
        />
      ))}
    </span>
  );
}

function SkillsSection() {
  const { token } = useAuth();
  const { activeProfile } = useActiveProfile();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(DEFAULT_SKILL_CATEGORIES[0]);
  const [level, setLevel] = useState<number>(3);
  const [customCategory, setCustomCategory] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [confirmDeleteSkill, setConfirmDeleteSkill] = useState<Skill | null>(null);

  const userQuery = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getMe(token),
  });

  const query = useQuery({
    queryKey: ["skills", activeProfile?.id],
    queryFn: () => listSkills(token, activeProfile?.id),
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

  const tierId = (userQuery.data?.subscriptionTier as TierId) ?? "free";
  const tier = getTier(tierId);
  const skillCount = query.data?.length ?? 0;
  const atSkillLimit = isAtLimit(tierId, "skills", skillCount);

  const addMutation = useMutation({
    mutationFn: () =>
      createSkill(token, {
        name: name.trim(),
        category: (useCustom ? customCategory.trim() : category) || "Other",
        level,
      }, activeProfile?.id),
    onSuccess: () => {
      toast.success("Skill added");
      setName("");
      setCustomCategory("");
      setUseCustom(false);
      qc.invalidateQueries({ queryKey: ["skills"] });
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not add skill"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteSkill(token, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skills"] });
      setConfirmDeleteSkill(null);
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not remove"),
  });

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; name: string; category: string; level: number }) =>
      updateSkill(token, input.id, { name: input.name, category: input.category, level: input.level }),
    onSuccess: () => {
      toast.success("Skill updated");
      qc.invalidateQueries({ queryKey: ["skills"] });
      cancelEdit();
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not update"),
  });

  function cancelEdit() {
    setEditingSkill(null);
    setName("");
    setCategory(DEFAULT_SKILL_CATEGORIES[0]);
    setLevel(3);
    setCustomCategory("");
    setUseCustom(false);
  }

  function startEdit(skill: Skill) {
    setEditingSkill(skill);
    setName(skill.name);
    setLevel(skill.level);
    const isCustom = !DEFAULT_SKILL_CATEGORIES.includes(skill.category);
    if (isCustom) {
      setUseCustom(true);
      setCustomCategory(skill.category);
      setCategory(DEFAULT_SKILL_CATEGORIES[0]);
    } else {
      setUseCustom(false);
      setCategory(skill.category);
      setCustomCategory("");
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Enter a skill name");
      return;
    }
    const cat = (useCustom ? customCategory.trim() : category) || "Other";
    if (editingSkill) {
      updateMutation.mutate({ id: editingSkill.id, name: name.trim(), category: cat, level });
    } else {
      addMutation.mutate();
    }
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
          <Select value={String(level)} onValueChange={(v) => setLevel(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SKILL_LEVELS.map((l) => (
                <SelectItem key={l} value={String(SKILL_LEVEL_VALUES[l])}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {editingSkill ? (
            <>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="gap-1.5"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Save changes
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={cancelEdit}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              type="submit"
              disabled={addMutation.isPending || atSkillLimit}
              className="gap-1.5"
            >
              {addMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </Button>
          )}
        </form>

        {atSkillLimit ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 text-accent" />
            <p className="text-muted-foreground">
              You've reached the {tier.label} limit of {tier.skills} skills.{" "}
              <a
                href="https://portra.app/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent hover:underline"
              >
                Upgrade to get more →
              </a>
            </p>
          </div>
        ) : null}

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
                      <SkillLevelDots level={s.level} />
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`Edit ${s.name}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteSkill(s)}
                        className="text-muted-foreground hover:text-destructive"
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

      <AlertDialog
        open={Boolean(confirmDeleteSkill)}
        onOpenChange={(o) => !o && setConfirmDeleteSkill(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this skill?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDeleteSkill
                ? `${confirmDeleteSkill.name} will be removed from your skills.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteSkill && removeMutation.mutate(confirmDeleteSkill.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMutation.isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
