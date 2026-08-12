import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FolderKanban,
  Globe2,
  FileText,
  Eye,
  Plus,
  Briefcase,
  ExternalLink,
  Bell,
  CheckCheck,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useActiveProfile } from "@/lib/active-profile";
import { getDashboardStats, type DashboardStats } from "@/lib/dashboard";
import { getMe } from "@/lib/users";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/lib/notifications";
import { NotificationRow } from "@/components/dashboard/NotificationRow";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — Portra" }] }),
  component: DashboardHome,
});

function DashboardHome() {
  const { user, token } = useAuth();
  const { activeProfile } = useActiveProfile();
  const qc = useQueryClient();
  const greeting = user?.name?.split(" ")[0] ?? "there";

  const statsQuery = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => getDashboardStats(token),
  });

  const userQuery = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getMe(token),
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(token),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(token!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(token!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const s = statsQuery.data;

  const stats: { label: string; value: string; delta?: string; icon: LucideIcon }[] = s
    ? [
        {
          label: "Total Projects",
          value: String(s.total_projects),
          delta: `+${s.projects_this_month} this month`,
          icon: FolderKanban,
        },
        {
          label: "Published Projects",
          value: String(s.published_projects),
          delta: `+${s.published_this_week} this week`,
          icon: Globe2,
        },
        {
          label: "Blog Posts",
          value: String(s.total_blog_posts),
          delta: s.draft_blog_posts > 0 ? `${s.draft_blog_posts} draft${s.draft_blog_posts > 1 ? "s" : ""}` : undefined,
          icon: FileText,
        },
        {
          label: "Profile Views",
          value: s.profile_views_total.toLocaleString(),
          delta: `${s.profile_views_change_pct > 0 ? "+" : ""}${s.profile_views_change_pct}% vs. last week`,
          icon: Eye,
        },
      ]
    : [];

  const username = userQuery.data?.username ?? "";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back, {greeting}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Here's a snapshot of your portfolio activity.
          </p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsQuery.isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-5 shadow-soft animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="h-9 w-9 rounded-lg bg-muted" />
                </div>
                <div className="mt-4 h-8 w-16 rounded bg-muted" />
                <div className="mt-1 h-3 w-32 rounded bg-muted" />
              </div>
            ))
          : stats.map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.label}
                  className="rounded-2xl border border-border bg-card p-5 shadow-soft"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">{st.label}</span>
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent/10 text-accent">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-4 text-3xl font-semibold tracking-tight">{st.value}</p>
                  {st.delta ? (
                    <p className="mt-1 text-xs text-muted-foreground">{st.delta}</p>
                  ) : null}
                </div>
              );
            })}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {unreadCount} unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
        <div className="mt-4 space-y-1">
          {notificationsQuery.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-2.5">
                <div className="mt-0.5 h-4 w-4 shrink-0 rounded bg-muted animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-48 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-64 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onRead={(id) => markReadMutation.mutate(id)}
              />
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Quick actions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Jump straight into the next thing to publish.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction to="/dashboard/projects" icon={Plus} label="Add Project" />
          <QuickAction to="/dashboard/blog" icon={Plus} label="Add Blog Post" />
          <QuickAction to="/dashboard/experience" icon={Briefcase} label="Add Experience" />
          {username && activeProfile?.slug ? (
            <QuickAction
              to="/p/$username/$profileSlug"
              params={{ username, profileSlug: activeProfile.slug }}
              icon={ExternalLink}
              label="View Public Portfolio"
              tone="accent"
            />
          ) : username ? (
            <QuickAction
              to="/p/$username"
              params={{ username }}
              icon={ExternalLink}
              label="View Public Portfolio"
              tone="accent"
            />
          ) : (
            <QuickAction
              to="/dashboard/settings"
              icon={ExternalLink}
              label="Set Username to Preview"
              tone="accent"
            />
          )}
        </div>
      </section>
    </div>
  );
}

function QuickAction({
  to,
  params,
  icon: Icon,
  label,
  tone = "default",
}: {
  to: "/dashboard/projects" | "/dashboard/blog" | "/dashboard/experience" | "/dashboard/settings" | "/p/$username" | "/p/$username/$profileSlug";
  params?: { username: string; profileSlug?: string };
  icon: LucideIcon;
  label: string;
  tone?: "default" | "accent";
}) {
  const base =
    "group flex items-center justify-between gap-3 rounded-xl border p-4 text-sm font-medium transition-colors";
  const styles =
    tone === "accent"
      ? "border-accent/30 bg-accent/5 text-accent hover:bg-accent/10"
      : "border-border bg-background hover:border-accent/40 hover:bg-accent/5";
  return (
    <Link to={to} params={params as never} className={`${base} ${styles}`}>
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="text-muted-foreground group-hover:text-accent">→</span>
    </Link>
  );
}
