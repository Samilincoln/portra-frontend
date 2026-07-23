import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
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
  LogOut,
  ChevronDown,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";

const nav: Array<{
  to:
    | "/dashboard"
    | "/dashboard/projects"
    | "/dashboard/experience"
    | "/dashboard/testimonials"
    | "/dashboard/blog"
    | "/dashboard/settings";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}> = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { to: "/dashboard/blog", label: "Blog", icon: FileText },
  { to: "/dashboard/experience", label: "Experience", icon: Briefcase },
  { to: "/dashboard/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

function initials(name?: string, email?: string) {
  const src = (name ?? email ?? "U").trim();
  const parts = src.split(/\s+/);
  const chars = parts.length >= 2 ? parts[0][0] + parts[1][0] : src.slice(0, 2);
  return chars.toUpperCase();
}

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {nav.map((item) => {
        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarInner({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Portra</span>
      </div>
      <NavList pathname={pathname} onNavigate={onNavigate} />
      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-xl bg-sidebar-accent/50 p-3 text-xs text-sidebar-foreground/80">
          <p className="font-medium text-sidebar-foreground">Portra Pro</p>
          <p className="mt-1">Unlock custom domains &amp; analytics.</p>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate({ to: "/login", replace: true });
  }

  const displayName = user?.name ?? user?.email ?? "Your account";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 md:block">
        <SidebarInner pathname={pathname} />
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur md:gap-4 md:px-8">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarInner pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="topbar-search" className="sr-only">
              Search projects and posts
            </label>
            <input
              id="topbar-search"
              type="search"
              placeholder="Search projects, posts…"
              className="h-9 w-full rounded-lg border border-input bg-secondary/50 pl-9 pr-3 text-sm outline-none focus:border-ring focus:bg-background"
            />
          </div>
          <div className="flex-1 sm:flex-none" />
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Account menu"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-secondary"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {initials(user?.name, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[140px] truncate md:inline">{displayName}</span>
                <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:inline" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
