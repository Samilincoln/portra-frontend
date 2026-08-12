import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";

import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPortfolioProject } from "@/lib/portfolio";

export const Route = createFileRoute("/p/$username/$profileSlug/projects/$slug")({
  head: () => ({ meta: [{ title: "Case study — Portra" }] }),
  component: CaseStudyPage,
});

function CaseStudyPage() {
  const { username, profileSlug, slug } = Route.useParams();
  const query = useQuery({
    queryKey: ["portfolio", username, profileSlug, "projects", slug],
    queryFn: () => getPortfolioProject(username, profileSlug, slug),
  });

  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <Link
          to="/p/$username/$profileSlug"
          params={{ username, profileSlug }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>

        {query.isLoading ? (
          <div className="mt-10 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-8 h-64 w-full rounded-2xl" />
          </div>
        ) : query.isError || !query.data ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
            Project not found.
          </div>
        ) : (
          (() => {
            const project = query.data;
            return (
              <>
                <div className="mt-8">
                  {project.category ? (
                    <p className="text-sm font-medium uppercase tracking-wide text-accent">
                      {project.category}
                    </p>
                  ) : null}
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                    {project.title}
                  </h1>
                  {project.shortDescription ? (
                    <p className="mt-4 text-lg text-muted-foreground">
                      {project.shortDescription}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.githubUrl ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={project.githubUrl} target="_blank" rel="noreferrer">
                          <Github className="mr-1.5 h-4 w-4" /> Source
                        </a>
                      </Button>
                    ) : null}
                    {project.liveDemoUrl ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={project.liveDemoUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-1.5 h-4 w-4" /> Live demo
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>

                {project.thumbnailUrl ? (
                  <div className="mt-8 overflow-hidden rounded-2xl border border-border">
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}

                {project.technologies?.length ? (
                  <div className="mt-8">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Technologies
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.technologies.map((t) => (
                        <Badge key={t} variant="secondary" className="rounded-full">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {project.problem ? (
                  <section className="mt-8">
                    <h2 className="text-lg font-semibold tracking-tight">Problem</h2>
                    <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                      {project.problem}
                    </p>
                  </section>
                ) : null}

                {project.solution ? (
                  <section className="mt-8">
                    <h2 className="text-lg font-semibold tracking-tight">Solution</h2>
                    <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                      {project.solution}
                    </p>
                  </section>
                ) : null}

                {project.architecture ? (
                  <section className="mt-8">
                    <h2 className="text-lg font-semibold tracking-tight">Architecture</h2>
                    <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                      {project.architecture}
                    </p>
                  </section>
                ) : null}

                {project.results ? (
                  <section className="mt-8">
                    <h2 className="text-lg font-semibold tracking-tight">Results</h2>
                    <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                      {project.results}
                    </p>
                  </section>
                ) : null}
              </>
            );
          })()
        )}
      </article>
    </PublicLayout>
  );
}
