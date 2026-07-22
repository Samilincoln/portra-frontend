import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, FileText, Eye } from "lucide-react";

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

export const Route = createFileRoute("/dashboard/blog")({
  head: () => ({ meta: [{ title: "Blog — Portra" }] }),
  component: BlogListPage,
});

type StatusFilter = "all" | "published" | "draft";

function BlogListPage() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const query = useQuery({
    queryKey: ["blogs"],
    queryFn: () => listBlogs(token),
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Write essays, deep-dives, and technical notes.
          </p>
        </div>
        <Button asChild className="gap-1.5">
          <Link to="/dashboard/blog/new">
            <Plus className="h-4 w-4" /> New post
          </Link>
        </Button>
      </div>

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

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        {query.isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-5">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="ml-auto h-5 w-24" />
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            Couldn't load posts.
          </div>
        ) : filtered.length === 0 ? (
          (query.data?.length ?? 0) === 0 ? (
            <EmptyBlog />
          ) : (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">
              No posts match your filters.
            </div>
          )
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((p) => (
              <BlogRow key={p.id} post={p} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function BlogRow({ post }: { post: BlogPost }) {
  const published = post.status === "published";
  const date = post.publishedAt ?? post.createdAt;
  return (
    <li>
      <Link
        to="/dashboard/blog/$id/edit"
        params={{ id: post.id }}
        className="flex flex-wrap items-center gap-4 px-6 py-4 hover:bg-secondary/40"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{post.title || "Untitled"}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            /{post.slug}
          </p>
        </div>
        <Badge
          variant={published ? "default" : "secondary"}
          className={cn(
            published &&
              "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300",
          )}
        >
          {published ? "Published" : "Draft"}
        </Badge>
        <div className="hidden w-32 text-sm text-muted-foreground sm:block">
          {date
            ? new Date(date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—"}
        </div>
        <div className="hidden w-24 items-center gap-1.5 text-sm text-muted-foreground md:flex">
          <Eye className="h-4 w-4" />
          {post.views ?? 0}
        </div>
      </Link>
    </li>
  );
}

function EmptyBlog() {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
        <FileText className="h-5 w-5" />
      </div>
      <div>
        <p className="text-base font-medium">No posts yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Publish your first essay or technical note.
        </p>
      </div>
      <Button asChild className="mt-2 gap-1.5">
        <Link to="/dashboard/blog/new">
          <Plus className="h-4 w-4" /> New post
        </Link>
      </Button>
    </div>
  );
}
