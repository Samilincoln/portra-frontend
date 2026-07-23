import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getPortfolioBlog, PortfolioNotFoundError } from "@/lib/portfolio";

export const Route = createFileRoute("/p/$username/blog")({
  head: ({ params }) => ({
    meta: [
      { title: `Blog — ${params.username} — Portra` },
      { name: "description", content: `Latest posts from ${params.username}.` },
      { property: "og:title", content: `Blog — ${params.username}` },
      { property: "og:description", content: `Latest posts from ${params.username}.` },
    ],
  }),
  component: PublicBlogList,
});

function PublicBlogList() {
  const { username } = Route.useParams();
  const q = useQuery({
    queryKey: ["portfolio", username, "blog"],
    queryFn: () => getPortfolioBlog(username),
    retry: (n, err) => !(err instanceof PortfolioNotFoundError) && n < 2,
  });

  const posts = (q.data ?? [])
    .filter((p) => p.status === "published")
    .sort((a, b) =>
      (b.publishedAt ?? b.createdAt ?? "").localeCompare(
        a.publishedAt ?? a.createdAt ?? "",
      ),
    );

  return (
    <PublicLayout>
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-20">
        <Link
          to="/p/$username"
          params={{ username }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to portfolio
        </Link>
        <header className="mt-6">
          <p className="text-sm font-medium text-accent">Writing</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Insights & essays
          </h1>
          <p className="mt-3 text-muted-foreground">
            Notes on shipping AI systems, tooling, and craft.
          </p>
        </header>

        <div className="mt-10 space-y-4">
          {q.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))
          ) : q.error instanceof PortfolioNotFoundError ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Portfolio not found.
            </div>
          ) : q.isError ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">Couldn't load posts.</p>
              <Button variant="outline" size="sm" onClick={() => q.refetch()}>
                Try again
              </Button>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              No posts published yet.
            </div>
          ) : (
            posts.map((post) => (
              <Link
                key={post.id}
                to="/p/$username/blog/$slug"
                params={{ username, slug: post.slug }}
                className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-elevated sm:flex-row sm:items-center sm:p-6"
              >
                {post.coverImageUrl ? (
                  <img
                    src={post.coverImageUrl}
                    alt={post.title}
                    className="h-32 w-full shrink-0 rounded-xl object-cover sm:h-24 sm:w-40"
                  />
                ) : (
                  <div aria-hidden="true" className="h-32 w-full shrink-0 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 sm:h-24 sm:w-40" />
                )}
                <div className="min-w-0 flex-1">
                  {post.publishedAt ? (
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {formatDate(post.publishedAt)}
                    </p>
                  ) : null}
                  <h2 className="mt-1 text-lg font-semibold tracking-tight group-hover:text-accent">
                    {post.title}
                  </h2>
                  {post.tags?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 4).map((t) => (
                        <span key={t} className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
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
      </section>
    </PublicLayout>
  );
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
