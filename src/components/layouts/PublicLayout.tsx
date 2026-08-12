import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Sparkles, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function PublicLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Portra</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="hover:text-foreground">
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Portra. Portfolios for engineers.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
