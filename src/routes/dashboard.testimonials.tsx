import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Plus, Star, Trash2, MessageSquareQuote, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  createTestimonial,
  deleteTestimonial,
  listTestimonials,
  type Testimonial,
  type TestimonialInput,
} from "@/lib/testimonials";
import { getMe } from "@/lib/users";
import { getTier, isAtLimit, type TierId } from "@/lib/plans";
import { AlertCircle } from "lucide-react";
import { useActiveProfile } from "@/lib/active-profile";
import { NoProfileEmptyState } from "@/components/dashboard/NoProfileEmptyState";

export const Route = createFileRoute("/dashboard/testimonials")({
  head: () => ({ meta: [{ title: "Testimonials — Portra" }] }),
  component: TestimonialsPage,
});

const schema = z.object({
  author: z.string().trim().min(1, "Author is required"),
  company: z.string().optional(),
  role: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1, "Comment is required").max(1000),
});

function TestimonialsPage() {
  useAuth();
  const { activeProfile, profiles } = useActiveProfile();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Testimonial | null>(null);

  const userQuery = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getMe(),
  });

  const query = useQuery({
    queryKey: ["testimonials", activeProfile?.id],
    queryFn: () => listTestimonials(activeProfile?.id),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTestimonial(id),
    onSuccess: () => {
      toast.success("Testimonial removed");
      qc.invalidateQueries({ queryKey: ["testimonials"] });
      setConfirmDelete(null);
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not delete"),
  });

  const items = query.data ?? [];
  const tierId = (userQuery.data?.subscriptionTier as TierId) ?? "free";
  const tier = getTier(tierId);
  const atLimit = isAtLimit(tierId, "testimonials", items.length);

  if (!activeProfile || profiles.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Testimonials</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Social proof from collaborators, clients, and teammates.
          </p>
        </div>
        <NoProfileEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Testimonials</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Social proof from collaborators, clients, and teammates.
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          disabled={atLimit}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add testimonial
        </Button>
      </div>

      {atLimit ? (
        <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-accent" />
          <p className="text-muted-foreground">
            You've reached the {tier.label} limit of {tier.testimonials} testimonials.{" "}
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

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Couldn't load testimonials.
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-soft">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
            <MessageSquareQuote className="h-5 w-5" />
          </div>
          <p className="text-base font-medium">No testimonials yet</p>
          <p className="text-sm text-muted-foreground">
            Collect kind words from people you've built with.
          </p>
          <Button onClick={() => setAddOpen(true)} className="mt-2 gap-1.5">
            <Plus className="h-4 w-4" /> Add testimonial
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((t) => (
            <article
              key={t.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <RatingStars rating={t.rating} />
              <p className="mt-3 flex-1 whitespace-pre-wrap text-sm text-foreground/90">
                “{t.comment}”
              </p>
              <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{t.author}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[t.role, t.company].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete"
                  onClick={() => setConfirmDelete(t)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <AddTestimonialDialog open={addOpen} onOpenChange={setAddOpen} />

      <AlertDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this testimonial?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone.
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
    </div>
  );
}

function RatingStars({
  rating,
  interactive,
  onChange,
}: {
  rating: number;
  interactive?: boolean;
  onChange?: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={cn(
            "p-0.5",
            interactive ? "cursor-pointer" : "cursor-default",
          )}
        >
          <Star
            className={cn(
              "h-4 w-4",
              n <= rating
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function AddTestimonialDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  useAuth();
  const { activeProfile } = useActiveProfile();
  const qc = useQueryClient();
  const [form, setForm] = useState<TestimonialInput>({
    author: "",
    company: "",
    role: "",
    rating: 5,
    comment: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (input: TestimonialInput) => createTestimonial(input, activeProfile?.id),
    onSuccess: () => {
      toast.success("Testimonial added");
      qc.invalidateQueries({ queryKey: ["testimonials"] });
      onOpenChange(false);
      setForm({ author: "", company: "", role: "", rating: 5, comment: "" });
      setErrors({});
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not add"),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
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
    mutation.mutate(parsed.data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add testimonial</DialogTitle>
          <DialogDescription>
            Add a short quote from someone you've worked with.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Author</Label>
              <Input
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                placeholder="Ada Lovelace"
              />
              {errors.author && (
                <p className="text-xs text-destructive">{errors.author}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input
                value={form.company ?? ""}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Acme Inc."
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input
                value={form.role ?? ""}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="VP Engineering"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rating</Label>
              <RatingStars
                rating={form.rating}
                interactive
                onChange={(n) => setForm({ ...form, rating: n })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Comment</Label>
            <Textarea
              rows={4}
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="What did they say?"
            />
            {errors.comment && (
              <p className="text-xs text-destructive">{errors.comment}</p>
            )}
          </div>
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
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add testimonial"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
