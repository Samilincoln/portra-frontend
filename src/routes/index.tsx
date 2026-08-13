import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portra — Portfolios for builders who ship" },
      {
        name: "description",
        content:
          "Portra is the premium portfolio platform for engineers and developers. Publish what you build — no themes, no CMS, no fuss.",
      },
      { property: "og:title", content: "Portra — Portfolios for builders who ship" },
      {
        property: "og:description",
        content: "Publish what you build — no themes, no CMS, no fuss.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            For builders who ship
          </span>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
            The portfolio your engineering work deserves.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Publish what you build — no themes, no CMS, no fuss.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-soft hover:bg-primary/90"
            >
              Start your portfolio <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground hover:bg-secondary"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
