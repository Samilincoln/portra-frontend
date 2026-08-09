import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Star,
  MoreHorizontal,
  Pencil,
  Eye,
  Trash2,
  FolderKanban,
  ImageIcon,
} from "lucide-react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useAuth } from "@/lib/auth";
import { listProjects, type Project } from "@/lib/projects";
import { getMe } from "@/lib/users";
import { AddProjectDialog } from "@/components/dashboard/AddProjectDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/projects")({
  head: () => ({ meta: [{ title: "Projects — Portra" }] }),
  component: ProjectsPage,
});

type StatusFilter = "all" | "published" | "draft";

function ProjectsPage() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [addOpen, setAddOpen] = useState(false);
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getMe(token),
  });

  const query = useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjects(token),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to delete project");
    },
    onSuccess: () => {
      toast.success("Project deleted");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => toast.error("Could not delete project"),
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
        (p.category ?? "").toLowerCase().includes(term) ||
        (p.shortDescription ?? "").toLowerCase().includes(term)
      );
    });
  }, [query.data, search, status]);

  const username = userQuery.data?.username ?? "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Case studies and builds featured on your portfolio.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add project
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
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
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <ErrorState onRetry={() => query.refetch()} />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <NewProjectCard onAdd={() => setAddOpen(true)} />
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                username={username}
                onDelete={deleteMutation.mutate}
              />
            ))}
          </div>
          {(query.data?.length ?? 0) === 0 ? (
            <div className="mt-6 rounded-2xl border border-border bg-card shadow-soft">
              <EmptyState onAdd={() => setAddOpen(true)} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              No projects match your filters.
            </p>
          ) : null}
        </>
      )}

      <AddProjectDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function ProjectActionsMenu({
  project,
  username,
  onDelete,
}: {
  project: Project;
  username: string;
  onDelete: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Project actions" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44" forceMount>
        <DropdownMenuItem asChild>
          <Link
            to="/dashboard/projects/$id"
            params={{ id: project.id }}
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        {username && (
          <DropdownMenuItem asChild>
            <Link
              to="/p/$username/projects/$slug"
              params={{ username, slug: project.slug }}
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Eye className="h-4 w-4" />
              Preview
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(project.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NewProjectCard({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex min-h-64 flex-col justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center transition-colors hover:border-accent hover:bg-accent/5"
    >
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-accent/10 text-accent">
        <Plus className="h-5 w-5" />
      </span>
      <span className="text-base font-medium">Add project</span>
      <span className="text-xs text-muted-foreground">
        Publish a new case study with problem, solution and results.
      </span>
    </button>
  );
}

function ProjectCard({
  project,
  username,
  onDelete,
}: {
  project: Project;
  username: string;
  onDelete: (id: string) => void;
}) {
  const published = project.status === "published";
  return (
    <article className="flex min-h-64 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-shadow hover:shadow-elevated">
      <div className="relative h-32 w-full bg-muted">
        {project.thumbnailUrl ? (
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <ImageIcon className="h-5 w-5" />
          </div>
        )}
        {project.featured ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-1 text-xs font-medium backdrop-blur">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            Featured
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant={published ? "default" : "secondary"}
            className={cn(
              published &&
                "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300",
            )}
          >
            {published ? "Published" : "Draft"}
          </Badge>
          <span className="truncate text-xs text-muted-foreground">
            {project.category ?? "—"}
          </span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-base font-semibold tracking-tight">
          {project.title}
        </h3>
        {project.shortDescription ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {project.shortDescription}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <Button asChild size="sm" variant={published ? "outline" : "default"} className="gap-1.5">
            <Link to="/dashboard/projects/$id" params={{ id: project.id }}>
              <Pencil className="h-3.5 w-3.5" />
              {published ? "Edit" : "Continue editing"}
            </Link>
          </Button>
          <ProjectActionsMenu
            project={project}
            username={username}
            onDelete={onDelete}
          />
        </div>
      </div>
    </article>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
        <FolderKanban className="h-5 w-5" />
      </div>
      <div>
        <p className="text-base font-medium">No projects yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first one to start building your portfolio.
        </p>
      </div>
      <Button onClick={onAdd} className="mt-2 gap-1.5">
        <Plus className="h-4 w-4" />
        Add project
      </Button>
    </div>
  );
}

function NoMatchState() {
  return (
    <div className="px-6 py-16 text-center text-sm text-muted-foreground">
      No projects match your filters.
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <p className="text-sm text-muted-foreground">
        We couldn't load your projects.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
