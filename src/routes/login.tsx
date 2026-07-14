import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — Portra" }] }),
  component: () => (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-soft">
        <h1 className="text-2xl font-semibold tracking-tight">Log in to Portra</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Auth screens land tomorrow. This is a placeholder.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block text-sm font-medium text-accent hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  ),
});
