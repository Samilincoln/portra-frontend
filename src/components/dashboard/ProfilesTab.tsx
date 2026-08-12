import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

import { useAuth } from "@/lib/auth";
import {
  listProfiles,
  getProfileLimits,
  deleteProfile,
  setDefaultProfile,
  type Profile,
} from "@/lib/profiles";
import { getTier, formatLimit, type TierId } from "@/lib/plans";
import { ProfileDialog } from "./ProfileDialog";

export function ProfilesTab() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Profile | null>(null);

  const profilesQuery = useQuery({
    queryKey: ["profiles"],
    queryFn: () => listProfiles(token),
  });

  const limitsQuery = useQuery({
    queryKey: ["profile-limits"],
    queryFn: () => getProfileLimits(token),
  });

  const profiles = profilesQuery.data ?? [];
  const limits = limitsQuery.data;
  const tierId = (limits?.tier as TierId) ?? "free";
  const tier = getTier(tierId);
  const maxProfiles = limits?.maxProfiles ?? tier.profiles;
  const atLimit = profiles.length >= maxProfiles;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProfile(token, id),
    onSuccess: () => {
      toast.success("Profile deleted");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["profile-limits"] });
      setConfirmDelete(null);
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not delete"),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => setDefaultProfile(token, id),
    onSuccess: () => {
      toast.success("Default profile updated");
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not update"),
  });

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(profile: Profile) {
    setEditing(profile);
    setDialogOpen(true);
  }

  if (profilesQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan card */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">
                {tier.label} plan
              </h2>
              <Badge variant="secondary">{tier.price}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {profiles.length} of {formatLimit(maxProfiles)} profiles used
            </p>
          </div>
          {tierId === "free" ? (
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a
                href="https://portra.app/pricing"
                target="_blank"
                rel="noopener noreferrer"
              >
                Upgrade to Pro
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : tierId === "pro" ? (
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a
                href="https://portra.app/pricing"
                target="_blank"
                rel="noopener noreferrer"
              >
                Upgrade to Business
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : null}
        </div>

        {/* Limits breakdown */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Profiles", value: maxProfiles },
            { label: "Projects", value: tier.projects },
            { label: "Blog posts", value: tier.blogPosts },
            { label: "Experiences", value: tier.experiences },
            { label: "Skills", value: tier.skills },
            { label: "Testimonials", value: tier.testimonials },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border/60 bg-background/60 px-4 py-2.5"
            >
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-medium">{formatLimit(item.value)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Profiles list */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Profiles</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Each profile gets its own public portfolio page.
            </p>
          </div>
          <Button
            onClick={openAdd}
            disabled={atLimit}
            className="gap-1.5"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            New profile
          </Button>
        </div>

        {atLimit && profiles.length > 0 ? (
          <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-muted-foreground">
            You've reached the limit for the {tier.label} plan.{" "}
            {tierId === "free" ? (
              <Link
                to="/dashboard/settings"
                className="font-medium text-accent hover:underline"
              >
                Upgrade to Pro →
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="group flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-background/60 p-4 transition-colors hover:border-border"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-primary-foreground">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  profile.name.slice(0, 2).toUpperCase()
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{profile.name}</p>
                  {profile.isDefault ? (
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      Default
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  /{profile.slug}
                  {profile.headline ? ` · ${profile.headline}` : ""}
                </p>
              </div>

              <div className="flex shrink-0 gap-1">
                {profile.isDefault ? null : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDefaultMutation.mutate(profile.id)}
                    disabled={setDefaultMutation.isPending}
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    Set default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(profile)}
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmDelete(profile)}
                  aria-label="Delete"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {profiles.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No profiles yet. Create your first profile to get started.
            </div>
          ) : null}
        </div>
      </section>

      <ProfileDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{confirmDelete?.name}" profile
              and all its content. This can't be undone.
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
              {deleteMutation.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
