import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard/PagePlaceholder";

export const Route = createFileRoute("/dashboard/testimonials")({
  head: () => ({ meta: [{ title: "Testimonials — Portra" }] }),
  component: () => (
    <PagePlaceholder
      title="Testimonials"
      description="Collect and manage testimonials from collaborators."
    />
  ),
});
