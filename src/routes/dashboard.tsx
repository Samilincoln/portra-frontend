import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layouts/AppShell";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
