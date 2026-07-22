import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";

import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPortfolioProject } from "@/lib/portfolio";

export const Route = createFileRoute("/p/$username/projects/$slug")({
  head: () => ({ meta: [{ title: "Case study — Portra" }] }),
  component: CaseStudyPage,
});

function CaseStudyPage() {
  const { username, slug } = Route.useParams();
  const query = useQuery({
    queryKey: ["portfolio", username, "projects", slug],
    queryFn: () => getPortfolioProject(username, slug),
  });

  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <Link
          to="/p/$username"
          params={{ username }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to portfolio
        </Link>

        {query.isLoading ? (
          <div className="mt-8 space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="mt-8 h-80 w-full rounded-2xl" />
          </div>
        ) : query.isError || !query.data ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
            Case study not found.
          </div>
        ) : (
          <CaseStudy p={query.data} />
        )}
      </article>
    </PublicLayout>
  );
}

function CaseStudy({ p }: { p: import("@/lib/projects").Project }) {
  return (
    <div className="mt-8">
      <header>
        {p.category ? (
          <p className="text-sm font-medium text-accent">{p.category}</p>
        ) : null}
        <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
          {p.title}
        </h1>
        {p.shortDescription ? (
          <p className="mt-4 text-lg text-muted-foreground">
            {p.shortDescription}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          {p.liveDemoUrl ? (
            <a href={p.liveDemoUrl} target="_blank" rel="noreferrer">
              <Button className="gap-1.5">
                <ExternalLink className="h-4 w-4" /> Live demo
              </Button>
            </a>
          ) : null}
          {p.githubUrl ? (
            <a href={p.githubUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-1.5">
                <Github className="h-4 w-4" /> View code
              </Button>
            </a>
          ) : null}
        </div>
      </header>

      {p.thumbnailUrl ? (
        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-muted shadow-soft">
          <img src={p.thumbnailUrl} alt="" className="w-full" />
        </div>
      ) : null}

      <div className="mt-12 space-y-12">
        <Section title="Problem" body={p.problem} />
        <Section title="Solution" body={p.solution} />
        <Section
          title="Architecture"
          body={p.architecture}
          extra={
            p.screenshots?.length ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {p.screenshots.map((s) => (
                  <img
                    key={s}
                    src={s}
                    alt=""
                    className="rounded-xl border border-border shadow-soft"
                  />
                ))}
              </div>
            ) : null
          }
        />
        <Section title="Results" body={p.results} />

        {p.technologies?.length ? (
          <section>
            <h2 className="text-2xl font-semibold tracking-tight">
              Technologies
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.technologies.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="rounded-full border border-border bg-card px-3 py-1 text-sm font-medium"
                >
                  {t}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function Section({
  title,
  body,
  extra,
}: {
  title: string;
  body?: string | null;
  extra?: React.ReactNode;
}) {
  if (!body && !extra) return null;
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {body ? (
        <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-foreground/85">
          {body}
        </p>
      ) : null}
      {extra}
    </section>
  );
}
