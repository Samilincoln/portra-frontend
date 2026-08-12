import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  createProfile,
  updateProfile,
  type Profile,
  type ProfileInput,
} from "@/lib/profiles";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type ProfileForm = {
  name: string;
  slug: string;
  bio: string;
  headline: string;
  avatar: string;
  industries: string;
};

const emptyForm: ProfileForm = {
  name: "",
  slug: "",
  bio: "",
  headline: "",
  avatar: "",
  industries: "",
};

export function ProfileDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Profile | null;
}) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSlugEdited(false);
    setErrors({});
    if (editing) {
      setForm({
        name: editing.name,
        slug: editing.slug,
        bio: editing.bio ?? "",
        headline: editing.headline ?? "",
        avatar: editing.avatar ?? "",
        industries: (editing.industries ?? []).join(", "),
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, editing]);

  function autoSlug(name: string) {
    return slugify(name).slice(0, 50);
  }

  const mutation = useMutation({
    mutationFn: (input: ProfileInput) =>
      editing
        ? updateProfile(token, editing.id, input)
        : createProfile(token, input),
    onSuccess: () => {
      toast.success(editing ? "Profile updated" : "Profile created");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["profile-limits"] });
      onOpenChange(false);
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not save profile"),
  });

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.slug.trim()) e.slug = "Slug is required";
    else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(form.slug.trim()))
      e.slug = "Lowercase letters, numbers, and hyphens only";
    if (form.name.trim().length > 100) e.name = "Name is too long";
    if (form.bio.trim().length > 500) e.bio = "Bio is too long";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      name: form.name.trim(),
      slug: form.slug.trim(),
      bio: form.bio.trim() || undefined,
      headline: form.headline.trim() || undefined,
      avatar: form.avatar.trim() || undefined,
      industries: form.industries
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit profile" : "New profile"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update your profile details."
              : "Create a new portfolio profile."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: slugEdited ? f.slug : autoSlug(name),
                  }));
                }}
                placeholder="My Portfolio"
              />
              {errors.name ? (
                <p className="text-xs text-destructive">{errors.name}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
                placeholder="my-portfolio"
              />
              {errors.slug ? (
                <p className="text-xs text-destructive">{errors.slug}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Headline</Label>
            <Input
              value={form.headline}
              onChange={(e) =>
                setForm((f) => ({ ...f, headline: e.target.value }))
              }
              placeholder="Full-stack engineer building developer tools"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Bio</Label>
            <Textarea
              rows={3}
              value={form.bio}
              onChange={(e) =>
                setForm((f) => ({ ...f, bio: e.target.value }))
              }
              placeholder="A short paragraph about what you do."
            />
            {errors.bio ? (
              <p className="text-xs text-destructive">{errors.bio}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Avatar URL</Label>
            <Input
              value={form.avatar}
              onChange={(e) =>
                setForm((f) => ({ ...f, avatar: e.target.value }))
              }
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Industries</Label>
            <Input
              value={form.industries}
              onChange={(e) =>
                setForm((f) => ({ ...f, industries: e.target.value }))
              }
              placeholder="Manufacturing, Healthcare, Education"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of industries.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : null}
              {editing ? "Save changes" : "Create profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
