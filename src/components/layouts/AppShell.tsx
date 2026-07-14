import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  MessageSquareQuote,
  FileText,
  Settings,
  Search,
  Bell,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { to: "/dashboard/experience", label: "Experience", icon: Briefcase },
  { to: "/dashboard/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { to: "/dashboard/blog", label: "Blog", icon: FileText },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Portra</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-xl bg-sidebar-accent/50 p-3 text-xs text-sidebar-foreground/80">
            <p className="font-medium text-sidebar-foreground">Portra Pro</p>
            <p className="mt-1">Unlock custom domains & analytics.</p>
          </div>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search projects, posts…"
              className="h-9 w-full rounded-lg border border-input bg-secondary/50 pl-9 pr-3 text-sm outline-none focus:border-ring focus:bg-background"
            />
          </div>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent" />
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
