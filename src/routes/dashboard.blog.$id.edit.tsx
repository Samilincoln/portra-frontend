import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { getBlog } from "@/lib/blog";
import { BlogEditor } from "@/components/dashboard/BlogEditor";

export const Route = createFileRoute("/dashboard/blog/$id/edit")({
  head: () => ({ meta: [{ title: "Edit post — Portra" }] }),
  component: EditBlogPage,
});

function EditBlogPage() {
  const { id } = Route.useParams();
  useAuth();
  const query = useQuery({
    queryKey: ["blogs", id],
    queryFn: () => getBlog(id),
  });

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
        Couldn't load this post.
      </div>
    );
  }

  return <BlogEditor existing={query.data} />;
}
