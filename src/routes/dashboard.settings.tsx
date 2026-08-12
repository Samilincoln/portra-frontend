import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Moon, Palette, Sun, Trash2, Upload, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { deleteMe, getMe, updateMe, type UserProfile } from "@/lib/users";
import { PALETTES, useTheme, type PaletteId } from "@/lib/theme";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfilesTab } from "@/components/dashboard/ProfilesTab";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — Portra" }] }),
  component: SettingsPage,
});


function SettingsPage() {
  const { token, logout } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(token),
  });

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </div>
    );
  }

  const profile: UserProfile = query.data ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profile, portfolio, and account preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="profiles" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Profiles
          </TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab profile={profile} onSaved={() => qc.invalidateQueries({ queryKey: ["me"] })} />
        </TabsContent>
        <TabsContent value="profiles">
          <ProfilesTab />
        </TabsContent>
        <TabsContent value="portfolio">
          <PortfolioTab profile={profile} onSaved={() => qc.invalidateQueries({ queryKey: ["me"] })} />
        </TabsContent>
        <TabsContent value="account">
          <AccountTab
            profile={profile}
            onDeleted={() => {
              logout();
              navigate({ to: "/signup", replace: true });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ProfileTab({
  profile,
  onSaved,
}: {
  profile: UserProfile;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [form, setForm] = useState<UserProfile>(profile);
  useEffect(() => setForm(profile), [profile]);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Pick an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setForm((f) => ({ ...f, avatarUrl: String(reader.result) }));
    reader.onerror = () => toast.error("Could not read that image");
    reader.readAsDataURL(file);
  }

  const mutation = useMutation({
    mutationFn: (input: Partial<UserProfile>) => updateMe(token, input),
    onSuccess: () => {
      toast.success("Profile saved");
      onSaved();
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not save"),
  });

  return (
    <SectionCard
      title="Profile"
      description="How you show up across your portfolio."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({
            name: form.name,
            bio: form.bio,
            avatarUrl: form.avatarUrl,
            social: form.social,
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Profile picture</Label>
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                {form.avatarUrl ? (
                  <AvatarImage src={form.avatarUrl} alt="Profile picture" />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {(form.name ?? form.email ?? "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickFile}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-4 w-4" /> Upload
                </Button>
                {form.avatarUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setForm({ ...form, avatarUrl: "" })}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
            <Input
              value={form.avatarUrl ?? ""}
              onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
              placeholder="…or paste an image URL"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Bio</Label>
          <Textarea
            rows={4}
            value={form.bio ?? ""}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="One paragraph about what you build and who you help."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["github", "linkedin", "twitter", "website"] as const).map((k) => (
            <div className="space-y-1.5" key={k}>
              <Label className="capitalize">{k}</Label>
              <Input
                value={form.social?.[k] ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    social: { ...(form.social ?? {}), [k]: e.target.value },
                  })
                }
                placeholder={`https://${k === "website" ? "example.com" : `${k}.com/handle`}`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

function PortfolioTab({
  profile,
  onSaved,
}: {
  profile: UserProfile;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const { palette, setPalette, mode, setMode } = useTheme();
  const [form, setForm] = useState<UserProfile>(profile);
  useEffect(() => setForm(profile), [profile]);

  // Keep the live theme in sync with the saved profile theme.
  useEffect(() => {
    const saved = profile.theme;
    if (saved && saved !== palette && PALETTES.some((p) => p.id === saved)) {
      setPalette(saved as PaletteId);
    }
  }, [profile.theme, palette, setPalette]);

  const mutation = useMutation({
    mutationFn: (input: Partial<UserProfile>) => updateMe(token, input),
    onSuccess: () => {
      toast.success("Portfolio saved");
      onSaved();
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not save"),
  });

  return (
    <div className="space-y-6">
      <SectionCard
        title="Public address"
        description="Your portfolio lives at portra.app/p/username."
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({
              username: form.username,
              customDomain: form.customDomain,
              theme: form.theme,
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Username / slug</Label>
              <Input
                value={form.username ?? ""}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
                placeholder="ada"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Custom domain</Label>
              <Input
                value={form.customDomain ?? ""}
                onChange={(e) =>
                  setForm({ ...form, customDomain: e.target.value })
                }
                placeholder="you.dev"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Palette className="h-4 w-4" /> Theme
            </Label>
            <div className="grid gap-3 sm:grid-cols-3">
              {PALETTES.map((t) => {
                const active = (form.theme ?? palette) === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => {
                      setForm({ ...form, theme: t.id });
                      setPalette(t.id);
                    }}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-colors",
                      active
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/40",
                    )}
                  >
                    <div className="flex gap-1.5">
                      {t.colors.map((c) => (
                        <span
                          key={c}
                          className="h-6 w-6 rounded-full border border-border"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-sm font-medium">{t.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Appearance"
        description="Dark mode applies instantly across your dashboard and portfolio."
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-foreground">
              {mode === "dark" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-muted-foreground">
                Currently using the {mode} appearance.
              </p>
            </div>
          </div>
          <Switch
            checked={mode === "dark"}
            onCheckedChange={(v) => setMode(v ? "dark" : "light")}
            aria-label="Toggle dark mode"
          />
        </div>
      </SectionCard>
    </div>
  );
}

function AccountTab({
  profile,
  onDeleted,
}: {
  profile: UserProfile;
  onDeleted: () => void;
}) {
  const { token } = useAuth();
  const [email, setEmail] = useState(profile.email ?? "");
  useEffect(() => setEmail(profile.email ?? ""), [profile.email]);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const emailMutation = useMutation({
    mutationFn: () => updateMe(token, { email }),
    onSuccess: () => toast.success("Email updated"),
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not update"),
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      updateMe(token, { currentPassword: current, newPassword: next }),
    onSuccess: () => {
      toast.success("Password updated");
      setCurrent("");
      setNext("");
      setConfirm("");
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not update"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMe(token),
    onSuccess: () => {
      toast.success("Account deleted");
      onDeleted();
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "Could not delete account"),
  });

  return (
    <div className="space-y-6">
      <SectionCard title="Email">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            emailMutation.mutate();
          }}
        >
          <div className="min-w-[240px] flex-1 space-y-1.5">
            <Label>Email address</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={emailMutation.isPending}>
            {emailMutation.isPending ? "Saving…" : "Update email"}
          </Button>
        </form>
      </SectionCard>

      <SectionCard title="Password">
        <form
          className="grid gap-4 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (next.length < 8) {
              toast.error("Password must be at least 8 characters");
              return;
            }
            if (next !== confirm) {
              toast.error("Passwords don't match");
              return;
            }
            passwordMutation.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>Current password</Label>
            <Input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>New password</Label>
            <Input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm password</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <Button type="submit" disabled={passwordMutation.isPending}>
              {passwordMutation.isPending ? "Updating…" : "Change password"}
            </Button>
          </div>
        </form>
      </SectionCard>

      <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
        <h2 className="text-lg font-semibold tracking-tight text-destructive">
          Danger zone
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Deleting your account removes your portfolio, projects, and posts.
          This can't be undone.
        </p>
        <Button
          variant="destructive"
          className="mt-4 gap-1.5"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="h-4 w-4" /> Delete account
        </Button>
      </section>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              Your portfolio and all content will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
