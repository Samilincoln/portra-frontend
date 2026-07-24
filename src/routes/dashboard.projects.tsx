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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        {query.isLoading ? (
          <LoadingSkeleton />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : filtered.length === 0 ? (
          (query.data?.length ?? 0) === 0 ? (
            <EmptyState onAdd={() => setAddOpen(true)} />
          ) : (
            <NoMatchState />
          )
        ) : (
          <ProjectsTable projects={filtered} username={username} onDelete={deleteMutation.mutate} />
        )}
      </div>

      <AddProjectDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function ProjectsTable({
  projects,
  username,
  onDelete,
}: {
  projects: Project[];
  username: string;
  onDelete: (id: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[380px]">Project</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-16 text-center">Featured</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((p) => (
          <TableRow
            key={p.id}
            onClick={(e) => {
              if (e.currentTarget === e.target) {
                window.location.href = `/dashboard/projects/${p.id}`;
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <TableCell>
              <Link
                to="/dashboard/projects/$id"
                params={{ id: p.id }}
                className="flex items-center gap-3 hover:bg-secondary/50 rounded-md p-1.5 transition-colors"
              >
                <div className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                  {p.thumbnailUrl ? (
                    <img src={p.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium hover:text-accent transition-colors">{p.title}</p>
                  {p.shortDescription ? (
                    <p className="truncate text-xs text-muted-foreground">{p.shortDescription}</p>
                  ) : null}
                </div>
              </Link>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">{p.category ?? "—"}</span>
            </TableCell>
            <TableCell>
              <Badge
                variant={p.status === "published" ? "default" : "secondary"}
                className={cn(
                  p.status === "published" &&
                    "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300",
                )}
              >
                {p.status === "published" ? "Published" : "Draft"}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              <button
                type="button"
                aria-label={p.featured ? "Unfeature project" : "Feature project"}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Star
                  className={cn("h-4 w-4", p.featured && "fill-amber-400 text-amber-400")}
                />
              </button>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Project actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link
                      to="/dashboard/projects/$id"
                      params={{ id: p.id }}
                      className="flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  {username && (
                    <DropdownMenuItem asChild>
                      <Link
                        to="/p/$username/projects/$slug"
                        params={{ username, slug: p.slug }}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={() => onDelete(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function LoadingSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <Skeleton className="h-11 w-16 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
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
