import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard/PagePlaceholder";

export const Route = createFileRoute("/dashboard/projects")({
  head: () => ({ meta: [{ title: "Projects — Portra" }] }),
  component: () => (
    <PagePlaceholder
      title="Projects"
      description="Manage the projects that appear on your public portfolio."
    />
  ),
});
