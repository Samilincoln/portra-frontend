import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getPortfolioBlog, PortfolioNotFoundError } from "@/lib/portfolio";

export const Route = createFileRoute("/p/$username/$profileSlug/blog")({
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
  const { username, profileSlug } = Route.useParams();
  const q = useQuery({
    queryKey: ["portfolio", username, profileSlug, "blog"],
    queryFn: () => getPortfolioBlog(username, profileSlug),
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
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <Link
          to="/p/$username/$profileSlug"
          params={{ username, profileSlug }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>

        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Blog</h1>
        <p className="mt-2 text-muted-foreground">
          Essays, deep-dives, and technical notes.
        </p>

        {q.isLoading ? (
          <div className="mt-10 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : q.isError ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
            Couldn't load posts.
          </div>
        ) : posts.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
            No posts published yet.
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                to="/p/$username/$profileSlug/blog/$slug"
                params={{ username, profileSlug, slug: post.slug }}
                className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-shadow hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {post.coverImageUrl ? (
                  <div className="aspect-[2/1] overflow-hidden bg-muted">
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                    />
                  </div>
                ) : null}
                <div className="p-5">
                  {post.publishedAt ? (
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {new Date(post.publishedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  ) : null}
                  <h2 className="mt-1 text-xl font-semibold tracking-tight">
                    {post.title}
                  </h2>
                  {post.excerpt ? (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {post.excerpt}
                    </p>
                  ) : null}
                  {post.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 4).map((t) => (
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
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
