import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPortfolioBlogPost, PortfolioNotFoundError } from "@/lib/portfolio";
import { renderMarkdown } from "@/lib/blog";

export const Route = createFileRoute("/p/$username/blog/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — ${params.username} — Portra` },
      { property: "og:title", content: `${params.slug} — ${params.username}` },
      { property: "og:type", content: "article" },
    ],
  }),
  component: PublicBlogPost,
});

function PublicBlogPost() {
  const { username, slug } = Route.useParams();
  const q = useQuery({
    queryKey: ["portfolio", username, "blog", slug],
    queryFn: () => getPortfolioBlogPost(username, slug),
    retry: (n, err) => !(err instanceof PortfolioNotFoundError) && n < 2,
  });

  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-20">
        <Link
          to="/p/$username/blog"
          params={{ username }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All posts
        </Link>

        {q.isLoading ? (
          <div className="mt-8 space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="mt-8 h-72 w-full rounded-2xl" />
          </div>
        ) : q.error instanceof PortfolioNotFoundError || (!q.isLoading && !q.data) ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">Post not found.</p>
          </div>
        ) : q.isError ? (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">Couldn't load post.</p>
            <Button variant="outline" size="sm" onClick={() => q.refetch()}>Try again</Button>
          </div>
        ) : q.data ? (
          <>
            <header className="mt-6">
              {q.data.publishedAt ? (
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {formatDate(q.data.publishedAt)}
                </p>
              ) : null}
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                {q.data.title}
              </h1>
              {q.data.tags?.length ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {q.data.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="rounded-full">
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </header>
            {q.data.coverImageUrl ? (
              <img
                src={q.data.coverImageUrl}
                alt={q.data.title}
                className="mt-8 w-full rounded-2xl border border-border object-cover"
              />
            ) : null}
            <div
              className="prose prose-neutral mt-8 max-w-none text-foreground [&_a]:text-accent"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(q.data.content) }}
            />
          </>
        ) : null}
      </article>
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
