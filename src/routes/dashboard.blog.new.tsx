import { createFileRoute } from "@tanstack/react-router";
import { BlogEditor } from "@/components/dashboard/BlogEditor";

export const Route = createFileRoute("/dashboard/blog/new")({
  head: () => ({ meta: [{ title: "New post — Portra" }] }),
  component: () => <BlogEditor />,
});
