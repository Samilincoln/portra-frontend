import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  Calendar,
  Download,
  FileText,
  ArrowUpRight,
  Factory,
  GraduationCap,
  Stethoscope,
  Building2,
  Video,
  Boxes,
  Briefcase,
  Star,
  Mail,
  Send,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  getPortfolio,
  getPortfolioProjects,
  getPortfolioExperiences,
  getPortfolioTestimonials,
  getPortfolioBlog,
  submitContact,
  PortfolioNotFoundError,
} from "@/lib/portfolio";
import type { Skill } from "@/lib/skills";
import type { Experience } from "@/lib/experiences";
import type { Testimonial } from "@/lib/testimonials";
import type { BlogPost } from "@/lib/blog";

export const Route = createFileRoute("/p/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.username} — Portra` },
      {
        name: "description",
        content: `Portfolio of ${params.username} — projects, experience, and insights.`,
      },
      { property: "og:title", content: `${params.username} — Portra` },
      {
        property: "og:description",
        content: `Portfolio of ${params.username} on Portra.`,
      },
    ],
  }),
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
    retry: (n, err) => !(err instanceof PortfolioNotFoundError) && n < 2,
  });
  const projectsQ = useQuery({
    queryKey: ["portfolio", username, "projects"],
    queryFn: () => getPortfolioProjects(username),
    enabled: !profileQ.isError,
  });
  const experiencesQ = useQuery({
    queryKey: ["portfolio", username, "experience"],
    queryFn: () => getPortfolioExperiences(username),
    enabled: !profileQ.isError,
  });
  const testimonialsQ = useQuery({
    queryKey: ["portfolio", username, "testimonials"],
    queryFn: () => getPortfolioTestimonials(username),
    enabled: !profileQ.isError,
  });
  const blogQ = useQuery({
    queryKey: ["portfolio", username, "blog"],
    queryFn: () => getPortfolioBlog(username),
    enabled: !profileQ.isError,
  });

  if (profileQ.error instanceof PortfolioNotFoundError) {
    return (
      <PublicLayout>
        <section className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-muted-foreground">
            <Boxes className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Portfolio not found</h1>
          <p className="mt-3 text-muted-foreground">
            We couldn't find a portfolio at <span className="font-medium">@{username}</span>.
            It may have been moved or the link is incorrect.
          </p>
          <Link to="/" className="mt-6">
            <Button>Back to Portra</Button>
          </Link>
        </section>
      </PublicLayout>
    );
  }

  const profile = profileQ.data;
  const projects = (projectsQ.data ?? []).filter((p) => p.status === "published");
  const experiences = experiencesQ.data ?? profile?.experiences ?? [];
  const testimonials = testimonialsQ.data ?? [];
  const blogPosts = (blogQ.data ?? [])
    .filter((p) => p.status === "published")
    .sort((a, b) =>
      (b.publishedAt ?? b.createdAt ?? "").localeCompare(
        a.publishedAt ?? a.createdAt ?? "",
      ),
    );
  const latestPosts = blogPosts.slice(0, 3);

  const skillsByCategory = groupSkills(profile?.skills ?? []);
  const industries = profile?.industries?.length
    ? profile.industries.map((label) => ({ label, icon: iconForIndustry(label) }))
    : INDUSTRIES;

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-10 sm:px-6 md:pt-24 md:pb-12">
        {profileQ.isLoading ? (
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <Skeleton className="h-28 w-28 rounded-full sm:h-32 sm:w-32" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-10 w-72" />
            </div>
          </div>
        ) : profileQ.isError || !profile ? (
          <ErrorState onRetry={() => profileQ.refetch()} label="This portfolio isn't available." />
        ) : (
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
            <div className="shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={`${profile.name} profile picture`}
                  className="h-28 w-28 rounded-full border border-border object-cover shadow-elevated sm:h-32 sm:w-32"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-2xl font-semibold text-primary-foreground shadow-elevated sm:h-32 sm:w-32 sm:text-3xl"
                >
                  {initials(profile.name)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-accent">@{profile.username}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                {profile.name}
              </h1>
              {profile.headline ? (
                <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                  {profile.headline}
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
                <a href="#projects">
                  <Button className="gap-1.5">
                    <FileText className="h-4 w-4" /> View Case Studies
                  </Button>
                </a>
                {profile.bookingUrl ? (
                  <a href={profile.bookingUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="gap-1.5">
                      <Calendar className="h-4 w-4" /> Book Consultation
                    </Button>
                  </a>
                ) : null}
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
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <SectionHeader eyebrow="Capabilities" title="AI capabilities" description="The stack I reach for when shipping intelligent, production-ready systems." />
          <div className="mt-10 space-y-6">
            {profileQ.isLoading ? (
              <Skeleton className="h-24 w-full rounded-2xl" />
            ) : Object.keys(skillsByCategory).length === 0 ? (
              <EmptyState label="Capabilities coming soon." />
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
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <SectionHeader eyebrow="Industries" title="Where I've made an impact" />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {industries.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-5 text-center shadow-soft sm:p-6"
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Solutions */}
      <section id="projects" className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <SectionHeader eyebrow="Featured solutions" title="Case studies" description="A selection of intelligent systems I've shipped end-to-end." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {projectsQ.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-2xl" />
              ))
            ) : projectsQ.isError ? (
              <div className="col-span-full">
                <ErrorState onRetry={() => projectsQ.refetch()} label="Couldn't load projects." />
              </div>
            ) : projects.length === 0 ? (
              <div className="col-span-full">
                <EmptyState label="No published projects yet." />
              </div>
            ) : (
              projects.map((p) => (
                <Link
                  key={p.id}
                  to="/p/$username/projects/$slug"
                  params={{ username, slug: p.slug }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-shadow hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {p.thumbnailUrl ? (
                    <div className="aspect-[16/10] overflow-hidden bg-muted">
                      <img
                        src={p.thumbnailUrl}
                        alt={p.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : (
                    <div aria-hidden="true" className="aspect-[16/10] bg-gradient-to-br from-primary/10 to-accent/10" />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    {p.category ? (
                      <p className="text-xs font-medium uppercase tracking-wide text-accent">
                        {p.category}
                      </p>
                    ) : null}
                    <h3 className="mt-1 flex items-start justify-between gap-2 text-lg font-semibold tracking-tight">
                      <span className="min-w-0">{p.title}</span>
                      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
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

      {/* Timeline */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <SectionHeader eyebrow="Journey" title="Timeline" description="Roles, teams, and turning points." />
          <div className="mt-10">
            {experiencesQ.isLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
            ) : experiencesQ.isError ? (
              <ErrorState onRetry={() => experiencesQ.refetch()} label="Couldn't load experience." />
            ) : experiences.length === 0 ? (
              <EmptyState label="No experience listed yet." />
            ) : (
              <Timeline items={experiences} />
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <SectionHeader eyebrow="Praise" title="Testimonials" description="What collaborators and clients say." />
          <div className="mt-10">
            {testimonialsQ.isLoading ? (
              <Skeleton className="h-40 w-full rounded-2xl" />
            ) : testimonialsQ.isError ? (
              <ErrorState onRetry={() => testimonialsQ.refetch()} label="Couldn't load testimonials." />
            ) : testimonials.length === 0 ? (
              <EmptyState label="No testimonials yet." />
            ) : (
              <TestimonialsCarousel items={testimonials} />
            )}
          </div>
        </div>
      </section>

      {/* Latest Insights */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeader eyebrow="Writing" title="Latest insights" description="Notes on shipping AI, tooling, and craft." />
            {blogPosts.length > 3 ? (
              <Link
                to="/p/$username/blog"
                params={{ username }}
                className="text-sm font-medium text-accent hover:underline"
              >
                View all posts →
              </Link>
            ) : null}
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {blogQ.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-2xl" />
              ))
            ) : blogQ.isError ? (
              <div className="col-span-full">
                <ErrorState onRetry={() => blogQ.refetch()} label="Couldn't load posts." />
              </div>
            ) : latestPosts.length === 0 ? (
              <div className="col-span-full">
                <EmptyState label="No posts published yet." />
              </div>
            ) : (
              latestPosts.map((post) => (
                <BlogCard key={post.id} post={post} username={username} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-border bg-secondary/30">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-16">
          <div>
            <SectionHeader eyebrow="Contact" title="Let's build something" description="Share a project brief or say hi — I read every message." />
            <div className="mt-8 space-y-3 text-sm">
              {profile?.resumeUrl ? (
                <a href={profile.resumeUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" /> Download Resume
                  </Button>
                </a>
              ) : null}
              {profile?.social?.website ? (
                <p className="text-muted-foreground">Website: <a className="text-accent hover:underline" href={profile.social.website} target="_blank" rel="noreferrer">{profile.social.website}</a></p>
              ) : null}
            </div>
          </div>
          <ContactForm username={username} />
        </div>
      </section>
    </PublicLayout>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-medium text-accent">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {description ? <p className="mt-3 text-muted-foreground">{description}</p> : null}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function ErrorState({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-10 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>
    </div>
  );
}

function Timeline({ items }: { items: Experience[] }) {
  const sorted = [...items].sort((a, b) => b.startDate.localeCompare(a.startDate));
  return (
    <ol className="relative space-y-8 border-l border-border pl-6">
      {sorted.map((exp) => (
        <li key={exp.id} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[31px] top-1.5 grid h-6 w-6 place-items-center rounded-full border border-border bg-background text-accent"
          >
            <Briefcase className="h-3 w-3" />
          </span>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              {formatRange(exp.startDate, exp.endDate)}
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight">{exp.role}</h3>
            <p className="text-sm text-muted-foreground">
              {exp.company}
              {exp.location ? ` · ${exp.location}` : ""}
            </p>
            {exp.description ? (
              <p className="mt-3 text-sm text-foreground/80">{exp.description}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
  const [i, setI] = useState(0);
  const count = items.length;
  const prev = () => setI((v) => (v - 1 + count) % count);
  const next = () => setI((v) => (v + 1) % count);
  const t = items[i];
  return (
    <div className="space-y-6">
      <article className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="flex items-center gap-1 text-accent" aria-label={`${t.rating} out of 5`}>
          {Array.from({ length: 5 }).map((_, idx) => (
            <Star
              key={idx}
              className={`h-4 w-4 ${idx < t.rating ? "fill-accent" : "opacity-30"}`}
              aria-hidden="true"
            />
          ))}
        </div>
        <blockquote className="mt-4 text-base leading-relaxed text-foreground sm:text-lg">
          "{t.comment}"
        </blockquote>
        <div className="mt-6 flex items-center gap-3">
          {t.avatarUrl ? (
            <img
              src={t.avatarUrl}
              alt={t.author}
              className="h-10 w-10 rounded-full border border-border object-cover"
            />
          ) : (
            <div aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-sm font-semibold">
              {initials(t.author)}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold">{t.author}</p>
            {(t.role || t.company) && (
              <p className="text-xs text-muted-foreground">
                {[t.role, t.company].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>
      </article>
      {count > 1 ? (
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5" role="tablist" aria-label="Testimonials">
            {items.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Go to testimonial ${idx + 1}`}
                aria-selected={idx === i}
                role="tab"
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-accent" : "w-1.5 bg-border"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={prev} aria-label="Previous testimonial">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={next} aria-label="Next testimonial">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BlogCard({ post, username }: { post: BlogPost; username: string }) {
  return (
    <Link
      to="/p/$username/blog/$slug"
      params={{ username, slug: post.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-shadow hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {post.coverImage ? (
        <div className="aspect-[16/9] overflow-hidden bg-muted">
          <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
        </div>
      ) : (
        <div aria-hidden="true" className="aspect-[16/9] bg-gradient-to-br from-primary/10 to-accent/10" />
      )}
      <div className="flex flex-1 flex-col p-5">
        {post.publishedAt ? (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {formatDate(post.publishedAt)}
          </p>
        ) : null}
        <h3 className="mt-1 text-lg font-semibold tracking-tight">{post.title}</h3>
        {post.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function ContactForm({ username }: { username: string }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const mut = useMutation({
    mutationFn: () => submitContact(username, form),
    onSuccess: () => {
      toast.success("Message sent — thanks for reaching out!");
      setForm({ name: "", email: "", message: "" });
    },
    onError: (e: { message?: string }) => toast.error(e?.message ?? "Couldn't send message"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all fields");
      return;
    }
    mut.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="space-y-2">
        <Label htmlFor="contact-name">Name</Label>
        <Input
          id="contact-name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Jane Doe"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="jane@company.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          rows={5}
          placeholder="Tell me about your project…"
          required
        />
      </div>
      <Button type="submit" disabled={mut.isPending} className="w-full gap-2 sm:w-auto">
        {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Send message
      </Button>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Mail className="h-3 w-3" /> Replies typically within 24 hours.
      </p>
    </form>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
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
  const m = INDUSTRIES.find((i) => i.label.toLowerCase() === label.toLowerCase());
  return m?.icon ?? Boxes;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatRange(start: string, end?: string | null) {
  const fmt = (s: string) => {
    const [y, m] = s.split("-");
    if (!y) return s;
    const d = new Date(Number(y), m ? Number(m) - 1 : 0, 1);
    return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  };
  return `${fmt(start)} — ${end ? fmt(end) : "Present"}`;
}
