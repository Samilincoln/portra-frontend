import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, FileText, Eye, Pencil, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { useAuth } from "@/lib/auth";
import { listBlogs, type BlogPost } from "@/lib/blog";
import { getMe } from "@/lib/users";
import { getTier, isAtLimit, type TierId } from "@/lib/plans";
import { AlertCircle } from "lucide-react";
import { useActiveProfile } from "@/lib/active-profile";
import { NoProfileEmptyState } from "@/components/dashboard/NoProfileEmptyState";

export const Route = createFileRoute("/dashboard/blog/")({
  head: () => ({
    meta: [
      { title: "Blog posts & drafts — Portra" },
      {
        name: "description",
        content:
          "Create new posts, continue drafts, and use the AI assistant to write or rewrite your engineering blog.",
      },
      { property: "og:title", content: "Blog posts & drafts — Portra" },
      {
        property: "og:description",
        content: "Create, draft, and edit posts for your Portra portfolio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlogListPage,
});

type StatusFilter = "all" | "published" | "draft";

function BlogListPage() {
  useAuth();
  const { activeProfile, profiles } = useActiveProfile();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const userQuery = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getMe(),
  });

  const query = useQuery({
    queryKey: ["blogs", activeProfile?.id],
    queryFn: () => listBlogs({ profileId: activeProfile?.id }),
  });

  const filtered = useMemo(() => {
    const list = query.data ?? [];
    const term = search.trim().toLowerCase();
    return list.filter((p) => {
      const statusOk = status === "all" || p.status === status;
      if (!statusOk) return false;
      if (!term) return true;
      return (
        p.title.toLowerCase().includes(term) ||
        (p.slug ?? "").toLowerCase().includes(term)
      );
    });
  }, [query.data, search, status]);

  const drafts = filtered.filter((p) => p.status !== "published");
  const published = filtered.filter((p) => p.status === "published");

  const tierId = (userQuery.data?.subscriptionTier as TierId) ?? "free";
  const tier = getTier(tierId);
  const blogCount = query.data?.length ?? 0;
  const atLimit = isAtLimit(tierId, "blogPosts", blogCount);

  if (!activeProfile || profiles.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Write essays, deep-dives, and technical notes.
          </p>
        </div>
        <NoProfileEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Write essays, deep-dives, and technical notes.
          </p>
        </div>
        <Button asChild className="gap-1.5" disabled={atLimit}>
          <Link to="/dashboard/blog/new">
            <Plus className="h-4 w-4" /> New post
          </Link>
        </Button>
      </div>

      {atLimit ? (
        <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-accent" />
          <p className="text-muted-foreground">
            You've reached the {tier.label} limit of {tier.blogPosts} blog posts.{" "}
            <a
              href="https://portra.app/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:underline"
            >
              Upgrade to get more →
            </a>
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts…"
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as StatusFilter)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
          Couldn't load posts.
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <NewPostCard />
            {drafts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>

          {published.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Published
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {published.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            </section>
          ) : null}

          {(query.data?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <p className="mt-3 text-base font-medium">No posts yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Start a draft, or let the AI assistant write the first pass.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No posts match your filters.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function NewPostCard() {
  return (
    <Link
      to="/dashboard/blog/new"
      className="group flex min-h-44 flex-col justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center transition-colors hover:border-accent hover:bg-accent/5"
    >
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-accent/10 text-accent">
        <Plus className="h-5 w-5" />
      </div>
      <p className="text-base font-medium">New post</p>
      <p className="text-xs text-muted-foreground">
        Start from a blank page or draft it with the AI assistant.
      </p>
      <span className="mx-auto mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent">
        <Sparkles className="h-3.5 w-3.5" /> AI assistant available
      </span>
    </Link>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  const published = post.status === "published";
  const date = post.publishedAt ?? post.createdAt;
  const excerpt =
    post.excerpt ??
    (post.content ? post.content.replace(/[#>*`_]/g, "").slice(0, 140) : "");

  return (
    <article className="flex min-h-44 flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <Badge
          variant={published ? "default" : "secondary"}
          className={cn(
            published &&
              "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300",
          )}
        >
          {published ? "Published" : "Draft"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {date
            ? new Date(date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—"}
        </span>
      </div>

      <h3 className="mt-3 line-clamp-2 text-base font-semibold tracking-tight">
        {post.title || "Untitled"}
      </h3>
      <p className="mt-1 truncate text-xs text-muted-foreground">/{post.slug}</p>
      {excerpt ? (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {excerpt}
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          {post.views ?? 0}
        </span>
        <Button asChild size="sm" variant={published ? "outline" : "default"} className="gap-1.5">
          <Link to="/dashboard/blog/$id/edit" params={{ id: post.id }}>
            <Pencil className="h-3.5 w-3.5" />
            {published ? "Edit" : "Continue draft"}
          </Link>
        </Button>
      </div>
    </article>
  );
}
