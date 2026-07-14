import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FolderKanban,
  Globe2,
  FileText,
  Eye,
  Plus,
  Briefcase,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — Portra" }] }),
  component: DashboardHome,
});

type Stat = { label: string; value: string; delta?: string; icon: LucideIcon };

const stats: Stat[] = [
  { label: "Total Projects", value: "12", delta: "+2 this month", icon: FolderKanban },
  { label: "Published Projects", value: "8", delta: "+1 this week", icon: Globe2 },
  { label: "Blog Posts", value: "5", delta: "1 draft", icon: FileText },
  { label: "Profile Views", value: "1,284", delta: "+18% vs. last week", icon: Eye },
];

function DashboardHome() {
  const { user } = useAuth();
  const greeting = user?.name?.split(" ")[0] ?? "there";

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
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight">{s.value}</p>
              {s.delta ? (
                <p className="mt-1 text-xs text-muted-foreground">{s.delta}</p>
              ) : null}
            </div>
          );
        })}
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
          <QuickAction
            to="/p/$username"
            params={{ username: "me" }}
            icon={ExternalLink}
            label="View Public Portfolio"
            tone="accent"
          />
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
  to: "/dashboard/projects" | "/dashboard/blog" | "/dashboard/experience" | "/p/$username";
  params?: { username: string };
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
