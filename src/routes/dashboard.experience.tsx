import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard/PagePlaceholder";

export const Route = createFileRoute("/dashboard/experience")({
  head: () => ({ meta: [{ title: "Experience — Portra" }] }),
  component: () => (
    <PagePlaceholder
      title="Experience & Skills"
      description="Curate your work history and technical skills."
    />
  ),
});
