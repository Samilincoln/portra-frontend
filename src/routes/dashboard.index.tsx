import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard/PagePlaceholder";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — Portra" }] }),
  component: () => (
    <PagePlaceholder
      title="Welcome back"
      description="Your dashboard overview will live here once we wire it up on Day 3."
    />
  ),
});
