import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Boxes, Loader2 } from "lucide-react";

import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/auth";

export const Route = createFileRoute("/p/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.username} — Portra` },
      {
        name: "description",
        content: `Portfolio of ${params.username} — projects, experience, and insights.`,
      },
      { property: "og:title", content: `${params.username} — Portra` },
      {
        property: "og:description",
        content: `Portfolio of ${params.username} on Portra.`,
      },
    ],
  }),
  component: ProfileLayout,
});

type ProfileSummary = { slug: string; isDefault: boolean };

async function fetchProfilesForRedirect(): Promise<ProfileSummary[]> {
  const base = typeof window === "undefined" && API_BASE_URL ? API_BASE_URL : "";
  const res = await fetch(`${base}/api/v1/profiles`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const items = Array.isArray(data) ? data : (data.profiles ?? []);
  return items.map((p: Record<string, unknown>) => ({
    slug: String(p.slug ?? ""),
    isDefault: Boolean(p.is_default ?? p.isDefault),
  }));
}

function ProfileLayout() {
  const { pathname } = useRouterState().location;
  const parts = pathname.split("/").filter(Boolean);
  const hasProfileSlug = parts.length >= 3 && parts[0] === "p";

  if (hasProfileSlug) {
    return (
      <>
        <Outlet />
        <Toaster />
      </>
    );
  }

  const username = parts[1] ?? "";
  return <ProfileRedirect username={username} />;
}

function ProfileRedirect({ username }: { username: string }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const profilesQ = useQuery({
    queryKey: ["profiles", "redirect", username],
    queryFn: () => fetchProfilesForRedirect(),
    retry: false,
  });

  useEffect(() => {
    if (!profilesQ.data?.length) return;
    const defaultProfile = profilesQ.data.find((p) => p.isDefault) ?? profilesQ.data[0];
    if (defaultProfile?.slug) {
      navigate({
        to: "/p/$username/$profileSlug",
        params: { username, profileSlug: defaultProfile.slug },
        replace: true,
      });
    }
  }, [profilesQ.data, username, navigate]);

  if (profilesQ.isLoading) {
    return (
      <PublicLayout>
        <div className="grid min-h-[50vh] place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-muted-foreground">
          <Boxes className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Portfolio not found</h1>
        <p className="mt-3 text-muted-foreground">
          We couldn't find a portfolio at <span className="font-medium">@{username}</span>.
          It may have been moved or the link is incorrect.
        </p>
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="mt-6">
          <Button>{isAuthenticated ? "Back to dashboard" : "Back to Portra"}</Button>
        </Link>
      </section>
    </PublicLayout>
  );
}
