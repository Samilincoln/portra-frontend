import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPortfolioBlogPost, PortfolioNotFoundError } from "@/lib/portfolio";
import { renderMarkdown } from "@/lib/blog";

export const Route = createFileRoute("/p/$username/$profileSlug/blog/$slug")({
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
  const { username, profileSlug, slug } = Route.useParams();
  const q = useQuery({
    queryKey: ["portfolio", username, profileSlug, "blog", slug],
    queryFn: () => getPortfolioBlogPost(username, profileSlug, slug),
    retry: (n, err) => !(err instanceof PortfolioNotFoundError) && n < 2,
  });

  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <Link
          to="/p/$username/$profileSlug/blog"
          params={{ username, profileSlug }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All posts
        </Link>

        {q.isLoading ? (
          <div className="mt-10 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-8 h-64 w-full rounded-2xl" />
          </div>
        ) : q.isError ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
            Post not found.
          </div>
        ) : q.data ? (
          <>
            <div className="mt-8">
              {q.data.publishedAt ? (
                <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {new Date(q.data.publishedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              ) : null}
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                {q.data.title}
              </h1>
              {q.data.tags?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {q.data.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="rounded-full">
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            {q.data.coverImageUrl ? (
              <div className="mt-8 overflow-hidden rounded-2xl border border-border">
                <img
                  src={q.data.coverImageUrl}
                  alt={q.data.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}

            <div
              className="prose prose-neutral dark:prose-invert mt-8 max-w-none"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(q.data.content ?? ""),
              }}
            />
          </>
        ) : null}
      </article>
    </PublicLayout>
  );
}
