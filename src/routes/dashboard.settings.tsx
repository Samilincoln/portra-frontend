import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard/PagePlaceholder";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — Portra" }] }),
  component: () => (
    <PagePlaceholder title="Settings" description="Profile, branding, and account settings." />
  ),
});
