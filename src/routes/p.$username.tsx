import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";

export const Route = createFileRoute("/p/$username")({
  head: () => ({ meta: [{ title: "Portfolio — Portra" }] }),
  component: PublicProfile,
});

function PublicProfile() {
  const { username } = Route.useParams();
  return (
    <PublicLayout>
      <section className="mx-auto max-w-4xl px-6 py-24">
        <p className="text-sm font-medium text-accent">Public portfolio</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">@{username}</h1>
        <p className="mt-4 text-muted-foreground">
          This public portfolio is a placeholder. Real content lands on Day 9.
        </p>
      </section>
    </PublicLayout>
  );
}
