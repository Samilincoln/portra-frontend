import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Github, Linkedin, Twitter, Globe, Check, ExternalLink } from "lucide-react";

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
import {
  getOAuthUrl,
  getLinkedAccounts,
  unlinkAccount,
  type OAuthProvider,
} from "@/lib/oauth";

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
  github: string;
  linkedin: string;
  twitter: string;
  website: string;
};

const emptyForm: ProfileForm = {
  name: "",
  slug: "",
  bio: "",
  headline: "",
  avatar: "",
  industries: "",
  github: "",
  linkedin: "",
  twitter: "",
  website: "",
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

  // Fetch linked OAuth accounts
  const { data: linkedAccounts = [] } = useQuery({
    queryKey: ["oauth-accounts"],
    queryFn: () => getLinkedAccounts(token),
    enabled: open,
  });

  function isProviderConnected(provider: OAuthProvider): boolean {
    return linkedAccounts.some((a) => a.provider === provider);
  }

  async function connectProvider(provider: OAuthProvider) {
    try {
      const { url, code_verifier } = await getOAuthUrl(token, provider);

      // Store code_verifier for Twitter PKCE flow (localStorage, not sessionStorage — popup can't access parent's sessionStorage)
      if (code_verifier) {
        localStorage.setItem("portra:twitter_code_verifier", code_verifier);
      }

      // Open popup
      const width = 600;
      const height = 700;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;
      const popup = window.open(
        url,
        `Connect ${provider}`,
        `width=${width},height=${height},left=${left},top=${top}`,
      );

      // Poll for popup close
      const timer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(timer);
          qc.invalidateQueries({ queryKey: ["oauth-accounts"] });
        }
      }, 500);
    } catch (err: { message?: string }) {
      toast.error(err?.message ?? "Failed to start connection");
    }
  }

  async function disconnectProvider(provider: OAuthProvider) {
    try {
      await unlinkAccount(token, provider);
      toast.success(`${provider} disconnected`);
      qc.invalidateQueries({ queryKey: ["oauth-accounts"] });
    } catch (err: { message?: string }) {
      toast.error(err?.message ?? "Failed to disconnect");
    }
  }

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
        github: editing.social?.github ?? "",
        linkedin: editing.social?.linkedin ?? "",
        twitter: editing.social?.twitter ?? "",
        website: editing.social?.website ?? "",
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
      toast.success(editing ? "Portfolio updated" : "Portfolio created");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["profile-limits"] });
      onOpenChange(false);
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not save portfolio"),
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
      social: {
        website: form.website.trim() || undefined,
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit portfolio" : "New portfolio"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update your portfolio details."
              : "Create a new portfolio."}
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

          <div className="space-y-3">
            <Label className="text-sm">Social connections</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["github", "linkedin", "twitter"] as const).map((provider) => {
                const connected = isProviderConnected(provider);
                return (
                  <div
                    key={provider}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">{provider}</span>
                      {connected && (
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <Check className="h-3 w-3" /> Connected
                        </span>
                      )}
                    </div>
                    {connected ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        onClick={() => disconnectProvider(provider)}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => connectProvider(provider)}
                      >
                        <ExternalLink className="h-3 w-3" /> Connect
                      </Button>
                    )}
                  </div>
                );
              })}

              {/* Website - Manual input */}
              <div className="space-y-1.5">
                <Label className="text-sm">Website</Label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Input
                    value={form.website}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, website: e.target.value }))
                    }
                    placeholder="https://yoursite.com"
                  />
                </div>
              </div>
            </div>
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
              {editing ? "Save changes" : "Create portfolio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
