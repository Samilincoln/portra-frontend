import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Download,
  FileText,
  Github,
  ArrowUpRight,
  Factory,
  GraduationCap,
  Stethoscope,
  Building2,
  Video,
  Boxes,
} from "lucide-react";

import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { getPortfolio, getPortfolioProjects } from "@/lib/portfolio";
import type { Skill } from "@/lib/skills";

export const Route = createFileRoute("/p/$username")({
  head: () => ({ meta: [{ title: "Portfolio — Portra" }] }),
  component: PublicPortfolio,
});

const INDUSTRIES = [
  { label: "Manufacturing", icon: Factory },
  { label: "Education", icon: GraduationCap },
  { label: "Healthcare", icon: Stethoscope },
  { label: "SMEs", icon: Building2 },
  { label: "Media", icon: Video },
  { label: "Enterprise", icon: Boxes },
];

function PublicPortfolio() {
  const { username } = Route.useParams();

  const profileQ = useQuery({
    queryKey: ["portfolio", username],
    queryFn: () => getPortfolio(username),
  });
  const projectsQ = useQuery({
    queryKey: ["portfolio", username, "projects"],
    queryFn: () => getPortfolioProjects(username),
  });

  const profile = profileQ.data;
  const projects = (projectsQ.data ?? []).filter(
    (p) => p.status === "published",
  );

  const skillsByCategory = groupSkills(profile?.skills ?? []);
  const industries = profile?.industries?.length
    ? profile.industries.map((label) => ({
        label,
        icon: iconForIndustry(label),
      }))
    : INDUSTRIES;

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12 md:pt-24">
        {profileQ.isLoading ? (
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-10 w-72" />
            </div>
          </div>
        ) : profileQ.isError || !profile ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">
              This portfolio isn't available.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            <div className="shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="h-32 w-32 rounded-full border border-border object-cover shadow-elevated"
                />
              ) : (
                <div className="grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-3xl font-semibold text-primary-foreground shadow-elevated">
                  {initials(profile.name)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-accent">
                @{profile.username}
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
                {profile.name}
              </h1>
              {profile.headline ? (
                <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                  {profile.headline}
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#projects">
                  <Button className="gap-1.5">
                    <FileText className="h-4 w-4" /> View Case Studies
                  </Button>
                </a>
                {profile.bookingUrl ? (
                  <a
                    href={profile.bookingUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="outline" className="gap-1.5">
                      <Calendar className="h-4 w-4" /> Book Consultation
                    </Button>
                  </a>
                ) : (
                  <Button variant="outline" className="gap-1.5" disabled>
                    <Calendar className="h-4 w-4" /> Book Consultation
                  </Button>
                )}
                {profile.resumeUrl ? (
                  <a href={profile.resumeUrl} target="_blank" rel="noreferrer">
                    <Button variant="ghost" className="gap-1.5">
                      <Download className="h-4 w-4" /> Download Resume
                    </Button>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* AI Capabilities */}
      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-accent">Capabilities</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              AI capabilities
            </h2>
            <p className="mt-3 text-muted-foreground">
              The stack I reach for when shipping intelligent, production-ready
              systems.
            </p>
          </div>
          <div className="mt-10 space-y-6">
            {Object.keys(skillsByCategory).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Capabilities coming soon.
              </p>
            ) : (
              Object.entries(skillsByCategory).map(([cat, skills]) => (
                <div key={cat}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {cat}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <Badge
                        key={s.id}
                        variant="secondary"
                        className="rounded-full border border-border bg-card px-3 py-1 text-sm font-medium"
                      >
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-accent">Industries</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Where I've made an impact
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {industries.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-6 text-center shadow-soft"
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Solutions */}
      <section id="projects" className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-accent">
                Featured solutions
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Case studies
              </h2>
              <p className="mt-3 text-muted-foreground">
                A selection of intelligent systems I've shipped end-to-end.
              </p>
            </div>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projectsQ.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-2xl" />
              ))
            ) : projects.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
                No published projects yet.
              </div>
            ) : (
              projects.map((p) => (
                <Link
                  key={p.id}
                  to="/p/$username/projects/$slug"
                  params={{ username, slug: p.slug }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-shadow hover:shadow-elevated"
                >
                  {p.thumbnailUrl ? (
                    <div className="aspect-[16/10] overflow-hidden bg-muted">
                      <img
                        src={p.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 to-accent/10" />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    {p.category ? (
                      <p className="text-xs font-medium uppercase tracking-wide text-accent">
                        {p.category}
                      </p>
                    ) : null}
                    <h3 className="mt-1 flex items-start justify-between gap-2 text-lg font-semibold tracking-tight">
                      <span>{p.title}</span>
                      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </h3>
                    {p.shortDescription ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {p.shortDescription}
                      </p>
                    ) : null}
                    {p.technologies?.length ? (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {p.technologies.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function groupSkills(skills: Skill[]): Record<string, Skill[]> {
  const out: Record<string, Skill[]> = {};
  for (const s of skills) {
    const key = s.category || "Other";
    (out[key] ??= []).push(s);
  }
  return out;
}

function iconForIndustry(label: string) {
  const m = INDUSTRIES.find(
    (i) => i.label.toLowerCase() === label.toLowerCase(),
  );
  return m?.icon ?? Boxes;
}
