import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard/PagePlaceholder";

export const Route = createFileRoute("/dashboard/blog")({
  head: () => ({ meta: [{ title: "Blog — Portra" }] }),
  component: () => (
    <PagePlaceholder title="Blog" description="Write and publish posts on your portfolio." />
  ),
});
